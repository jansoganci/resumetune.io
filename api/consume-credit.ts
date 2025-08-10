import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './stripe/supabase-integration';

// ================================================================
// CONSUME CREDIT API ENDPOINT
// ================================================================
// Bu endpoint kullanıcının kredisini 1 azaltır
// Frontend'den checkAndConsumeLimit fonksiyonu tarafından çağrılır

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sadece POST metodunu kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only POST requests are supported' 
    });
  }

  try {
    // 1. Kullanıcı ID'sini al
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User ID is missing in headers'
      });
    }

    // 2. Supabase client'ı oluştur
    const supabase = getSupabaseClient();
    
    // 3. Kullanıcının mevcut kredi bakiyesini kontrol et
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch user information'
      });
    }

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'User does not exist in database'
      });
    }

    // 4. Kredi kontrolü
    const currentCredits = user.credits_balance || 0;
    
    if (currentCredits <= 0) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        message: 'No credits remaining',
        currentCredits: 0
      });
    }

    // 5. Kredi tüket (1 azalt)
    const newBalance = Math.max(0, currentCredits - 1);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      return res.status(500).json({ 
        error: 'Update failed',
        message: 'Failed to update credit balance'
      });
    }

    // 6. Başarılı response
    console.log(`✅ Credit consumed for user ${userId}: ${currentCredits} → ${newBalance}`);
    
    return res.status(200).json({
      success: true,
      message: 'Credit consumed successfully',
      previousCredits: currentCredits,
      currentCredits: newBalance,
      consumed: 1
    });

  } catch (error) {
    console.error('❌ Consume credit error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while consuming credit'
    });
  }
}
