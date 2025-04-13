const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  try {
    // Create extensions schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('create_schema_if_not_exists', { schema_name: 'extensions' })

    if (schemaError) {
      console.error('Error creating schema:', schemaError)
      return
    }

    // Enable extensions
    const extensions = ['uuid-ossp', 'pgcrypto', 'citext']
    for (const ext of extensions) {
      const { data, error } = await supabase
        .rpc('create_extension_if_not_exists', { extension_name: ext })

      if (error) {
        console.error(`Error enabling extension ${ext}:`, error)
        return
      }
      console.log(`Extension ${ext} enabled successfully`)
    }

    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Error setting up database:', error)
  }
}

main() 