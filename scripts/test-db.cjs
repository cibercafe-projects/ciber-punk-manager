const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split(/\r?\n/).reduce((a, l) => {
  const m = l.match(/^([^#=\s]+)=(.*)$/);
  if (m) a[m[1]] = m[2].replace(/^"|"$/g, '');
  return a;
}, {});
const { createClient } = require('@supabase/supabase-js');
const c = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await c.from('achievements').select('code').limit(3);
  if (error) console.log('ERRO:', error.message);
  else console.log('OK conectado. Conquistas seed:', data.map(d => d.code).join(', '));
  const { count, error: e2 } = await c.from('projects').select('*', { count: 'exact', head: true });
  console.log(e2 ? 'projects ERRO: ' + e2.message : 'projects acessível, ' + count + ' linhas');
})();