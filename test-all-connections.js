/**
 * CONNECTION TEST - Frontend + Server + Database
 * Run this to verify all connections are working
 */

import { createClient } from '@supabase/supabase-js'

const VITE_SUPABASE_URL = 'https://yekirbhezyoefnhyxslt.supabase.co'
const VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla2lyYmhlenlvZWZuaHl4c2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzMxNjUsImV4cCI6MjA5MDQ0OTE2NX0.JlvoVn3zzPeN-e5_TW37k81ZZ65MYjiVl7fY5IEDz4A'

console.log('\n🔍 TESTING ALL CONNECTIONS...\n')
console.log('═'.repeat(60))

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

async function testConnections() {
  let allPassed = true

  // ═══════════════════════════════════════════════════════════
  // TEST 1: Frontend → Supabase Database Connection
  // ═══════════════════════════════════════════════════════════
  console.log('\n📊 TEST 1: Frontend → Supabase Database')
  console.log('─'.repeat(60))
  
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single()

    if (error) {
      console.log('❌ FAILED:', error.message)
      allPassed = false
    } else {
      console.log('✅ PASSED: Connected to Supabase')
      console.log('   School:', data?.name || 'N/A')
      console.log('   URL:', VITE_SUPABASE_URL)
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message)
    allPassed = false
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 2: Check Profiles Table
  // ═══════════════════════════════════════════════════════════
  console.log('\n👥 TEST 2: Profiles Table Access')
  console.log('─'.repeat(60))
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, role, school_id')
      .limit(3)

    if (error) {
      console.log('❌ FAILED:', error.message)
      allPassed = false
    } else {
      console.log('✅ PASSED: Can read profiles')
      console.log('   Users found:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Sample:', data[0].email, '-', data[0].role)
      }
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message)
    allPassed = false
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 3: Check Other Tables
  // ═══════════════════════════════════════════════════════════
  console.log('\n📚 TEST 3: Other Tables Access')
  console.log('─'.repeat(60))
  
  const tables = ['teachers', 'students', 'classes', 'grades']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)

      if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`)
      } else {
        console.log(`   ✅ ${table}: Accessible (${data?.length || 0} records)`)
      }
    } catch (error) {
      console.log(`   ❌ ${table}: ${error.message}`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 4: Server Connection (if running)
  // ═══════════════════════════════════════════════════════════
  console.log('\n🖥️  TEST 4: Backend Server (http://localhost:3001)')
  console.log('─'.repeat(60))
  
  try {
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ PASSED: Server is running')
      console.log('   Port: 3001')
      console.log('   Status:', data.status || 'OK')
    } else {
      console.log('⚠️  Server responded with:', response.status)
    }
  } catch (error) {
    console.log('⚠️  Server not running or not reachable')
    console.log('   This is OK - server is optional for basic features')
    console.log('   To start: cd server && npm run dev')
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Environment Variables
  // ═══════════════════════════════════════════════════════════
  console.log('\n⚙️  TEST 5: Environment Configuration')
  console.log('─'.repeat(60))
  
  console.log('✅ Supabase URL:', VITE_SUPABASE_URL ? 'Configured' : '❌ Missing')
  console.log('✅ Anon Key:', VITE_SUPABASE_ANON_KEY ? 'Configured' : '❌ Missing')
  
  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    allPassed = false
  }

  // ═══════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60))
  console.log('📋 CONNECTION SUMMARY')
  console.log('═'.repeat(60))
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!')
    console.log('\n✨ Your app is properly connected:')
    console.log('   • Frontend ✓')
    console.log('   • Database (Supabase) ✓')
    console.log('   • Environment Variables ✓')
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('\n⚠️  Check:')
    console.log('   1. .env.local has correct Supabase credentials')
    console.log('   2. Supabase project is active')
    console.log('   3. RLS policies allow access')
  }
  
  console.log('\n' + '═'.repeat(60) + '\n')
}

// Run tests
testConnections().catch(console.error)
