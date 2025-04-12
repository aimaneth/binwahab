import { supabase } from './supabase'
import { getServiceRoleClient } from './supabase'

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  try {
    // Using service role client for admin operations
    const supabaseAdmin = getServiceRoleClient()
    
    // Update the user's role in the User table
    const { data, error } = await supabaseAdmin
      .from('User')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { data: null, error }
  }
}

export async function getUserRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from('User')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting user role:', error)
    return { data: null, error }
  }
}

export async function isUserAdmin(userId: string) {
  const { data, error } = await getUserRole(userId)
  if (error) return false
  return data?.role === 'ADMIN'
} 