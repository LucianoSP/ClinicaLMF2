-- Create guias table
create table if not exists guias (
    id uuid default uuid_generate_v4() primary key,
    numero_guia varchar(255) not null,
    data_emissao date not null,
    data_validade date not null,
    status varchar(50) not null check (status in ('ativa', 'inativa', 'vencida')),
    paciente_id uuid references pacientes(id) on delete cascade,
    plano_id uuid references planos(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint guias_numero_guia_unique unique (numero_guia)
);

-- Create index for better search performance
create index if not exists idx_guias_numero_guia on guias(numero_guia);
create index if not exists idx_guias_paciente_id on guias(paciente_id);
create index if not exists idx_guias_plano_id on guias(plano_id);

-- Enable Row Level Security (RLS)
alter table guias enable row level security;

-- Create policy to allow all operations for authenticated users
create policy "Enable all operations for authenticated users" on guias
    for all
    to authenticated
    using (true)
    with check (true);
