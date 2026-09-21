-- Seed de conquistas v1 (rodar no SQL Editor do Supabase do VPS)
insert into public.achievements (code, name, description, criterion, rarity, reward_xp, reward_eddies, artwork_ref, unlocked_message)
values
  ('night_runner',   'NIGHT RUNNER',  'Complete 10 missões após 22:00',                 '{"type":"missions_late","target":10}',      'raras',     100, 200, 'night-runner.png',  'A cidade dorme. Você não.'),
  ('street_samurai', 'STREET SAMURAI','Complete 50 missões',                            '{"type":"missions_completed","target":50}', 'épicas',    250, 400, 'samurai.png',       'Aço em forma de disciplina.'),
  ('corpo_breaker',  'CORPO BREAKER', 'Complete um projeto inteiro',                    '{"type":"project_done","target":1}',        'épicas',    200, 300, 'corpo.png',         'Um terminal derrubado.'),
  ('foco_extremo',   'FOCO EXTREMO',  'Fique 4h em focus sem pausar',                   '{"type":"focus_minutes","target":240}',     'especiais', 300, 500, 'foco.png',          'Nada tirou você da zona.'),
  ('eficiencia',     'EFICIÊNCIA',    'Complete 20 missões sem prazo estourado',        '{"type":"missions_ontime","target":20}',    'rara',      150, 250, 'eficiencia.png',    'No prazo, sempre.'),
  ('lendario',       'LENDÁRIO',      'Complete 100 missões',                           '{"type":"missions_completed","target":100}','lendária',  500, 800, 'lendario.png',      'Lenda do distrito.'),
  ('morador_bloco',  'MORADOR DO BLOCO','7 dias de streak',                             '{"type":"streak","target":7}',              'comum',      50, 100, 'morador.png',       'O bloco conta com você.'),
  ('legend_corpo',   'LENDA DA CORP','Alcance o nível 10',                             '{"type":"level","target":10}',              'lendária',  400, 600, 'legend.png',        'Topo da hierarquia.')
on conflict (code) do nothing;
