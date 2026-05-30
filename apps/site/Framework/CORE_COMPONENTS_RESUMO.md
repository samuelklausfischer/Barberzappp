# BarberZap Admin Dashboard - Componentes Core Resumido

---

## Visão Geral

Biblioteca de **25 componentes reutilizáveis** organizados em 4 categorias visuais.

---

## 1. Data Display (5 componentes)

### StatCard
Card de métrica com ícone, valor, label e trend.

```jsx
<StatCard
  icon={DollarSign}
  value="R$ 4.521"
  label="Faturamento Hoje"
  trend="up"
  trendValue={12.5}
/>
```

**Props**: icon, value, label, trend, trendValue, loading, variant
**Variants**: default | compact | large

---

### DataTable
Tabela ordenável com paginação.

```jsx
<DataTable
  columns={[
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'E-mail' },
    { key: 'status', label: 'Status' }
  ]}
  data={customers}
  pagination={{ currentPage: 1, totalPages: 10 }}
  onRowClick={(row) => navigate(`/customers/${row.id}`)}
/>
```

**Props**: columns, data, loading, pagination, onPageChange, onSort, onRowClick
**Features**: Sort, pagination, selection, row click, custom render

---

### CardList
Lista de cards com multiple layouts.

```jsx
<CardList items={clients} orientation="vertical">
  {({ item }) => (
    <CardItem
      avatar={<Avatar name={item.name} />}
      title={item.name}
      subtitle={item.email}
      description={`${item.totalAppointments} visitas`}
      badge={<StatusBadge status={item.status} />}
    />
  )}
</CardList>
```

**Variants**: horizontal | vertical | grid
**Props**: items, orientation, hoverable, onItemClick

---

### Badge
Badges de status/roles.

```jsx
<Badge variant="success">Confirmado</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="error">Cancelado</Badge>
<Badge variant="info">Em andamento</Badge>
```

**Variantes**: success | warning | error | info | gold | default
**Estilos**: filled | outline | ghost
**Tamanhos**: xs | sm | base | lg
**Features**: Pulsing animation, colored dot

---

### Avatar
Avatar com initials fallback.

```jsx
<Avatar
  name="João Silva"
  src={avatarUrl}
  size="xl"
  showStatus
  status="online"
/>

<AvatarGroup>
  <Avatar name="Ana" />
  <Avatar name="Bruno" />
  <Avatar name="+5" />
</AvatarGroup>
```

**Tamanhos**: xs | sm | base | lg | xl | 2xl
**Status**: online | offline | busy | away
**Features**: Image, initials, status indicator, group overlay

---

## 2. Form Elements (7 componentes)

### Input
Campo de texto com estados.

```jsx
<Input
  label="Nome Completo"
  placeholder="Digite seu nome..."
  value={name}
  onChange={(e) => setName(e.target.value)}
  state="error"
  errorMessage="Este campo é obrigatório"
  helperText="Mínimo 3 caracteres"
  required
  leftIcon={<User />}
  rightIcon={<X />}
/>
```

**Estados**: default | error | success
**Flags**: disabled, loading, required
**Features**: Icons, helper text, error message, character count

---

### Select
Dropdown com busca.

```jsx
<Select
  label="Selecione um Serviço"
  options={[
    { value: 'haircut', label: 'Corte de Cabelo' },
    { value: 'beard', label: 'Barba' }
  ]}
  value={service}
  onChange={setService}
  searchable
/>
```

**Features**: Searchable, disabled, required, icon

---

### DatePicker
Selecionador de data.

```jsx
<DatePicker
  label="Data do Agendamento"
  value={date}
  onChange={setDate}
  minDate={new Date()}
  maxDate={maxDate}
  locale="pt-BR"
/>
```

**Features**: Min/max date, locale, icon, disabled, required

---

### PhoneInput
Input de telefone brasileiro.

```jsx
<PhoneInput
  label="Telefone"
  value={phone}
  onChange={setPhone}
  format="(XX) XXXXX-XXXX"
/>
```

**Features**: Auto-format, validation, country code

---

### Toggle
Switch on/off.

```jsx
<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Ativo"
  description="Habilitar notificações"
  size="sm"
/>
```

**Tamanhos**: sm | md | lg

---

### Checkbox/Radio
Checkboxes e radios customizados.

```jsx
<Checkbox
  checked={accepted}
  onChange={setAccepted}
  label="Concordo com os termos"
  required
/>

<RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
  <Radio value="pix" label="PIX" />
  <Radio value="card" label="Cartão" />
  <Radio value="cash" label="Dinheiro" />
</RadioGroup>
```

**Features**: Indeterminate state, disabled, required

---

### SearchBox
Busca global com histórico.

```jsx
<SearchBox
  placeholder="Buscar..."
  onSearch={(query) => performSearch(query)}
  suggestions={['João Silva', 'Corte Cabelo']}
  recentSearches={['Agenda hoje']}
  clearAfterSelect
/>
```

**Features**: Suggestions, recent searches, keyboard navigation, debounce

---

## 3. Navigation & Actions (7 componentes)

### Button
Botões com variantes.

```jsx
<Button variant="primary" leftIcon={<Plus />}>
  Criar
</Button>

<Button variant="secondary" rightIcon={<Download />}>
  Exportar
</Button>

<Button variant="outline" size="sm">
  Cancelar
</Button>

<Button variant="danger" loading>
  Excluir
</Button>
```

**Variantes**: primary | secondary | outline | danger | ghost
**Tamanhos**: sm | md | lg
**Features**: Icons, loading state, disabled, ripple (optional)

---

### IconButton
Botão de ícone.

```jsx
<IconButton
  icon={<Edit />}
  onClick={handleEdit}
  tooltip="Editar"
  variant="ghost"
/>
```

**Variantes**: ghost | outline | filled

---

### ButtonGroup
Grupo de botões.

```jsx
<ButtonGroup>
  <Button>Dia</Button>
  <Button variant="active">Semana</Button>
  <Button>Mês</Button>
</ButtonGroup>
```

---

### Tabs
Abas de navegação.

```jsx
<Tabs activeTab="overview" onChange={setActiveTab}>
  <Tab value="overview" label="Visão Geral" />
  <Tab value="details" label="Detalhes" />
  <Tab value="history" label="Histórico" />
</Tabs>
```

---

### Breadcrumbs
Breadcrumbs de navegação.

```jsx
<Breadcrumbs
  items={[
    { label: 'Home', path: '/admin' },
    { label: 'Clientes', path: '/admin/clientes' },
    { label: 'João Silva', active: true }
  ]}
/>
```

---

### Dropdown
Menu dropdown.

```jsx
<Dropdown trigger={<Button>Ações</Button>} align="right">
  <Dropdown.Item onClick={handleEdit}>Editar</Dropdown.Item>
  <Dropdown.Item onClick={handleDuplicate}>Duplicar</Dropdown.Item>
  <Dropdown.Separator />
  <Dropdown.Item onClick={handleDelete} variant="danger">Excluir</Dropdown.Item>
</Dropdown>
```

**Features**: Items, separators, keyboard navigation, nested dropdowns

---

### Pagination
Paginação de tabelas.

```jsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  showSizeChanger
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
/>
```

**Features**: Page sizing, jump-to-page, info text

---

## 4. Feedback & Overlays (6 componentes)

### Alert
Alertas informativos.

```jsx
<Alert variant="success" dismissible onDismiss={onDismiss}>
  <CheckCircle />
  <div>
    <p className="font-semibold">Sucesso!</p>
    <p>As alterações foram salvas.</p>
  </div>
</Alert>

<Alert variant="warning">
  <AlertCircle />
  <p>Atenção: Esta ação não pode ser desfeita.</p>
</Alert>
```

**Variantes**: success | warning | error | info
**Features**: Dismissible, icons, custom content

---

### Toast
Notificações toast.

```jsx
<Toast
  variant="success"
  title="Agendamento criado!"
  message="Confirmado para amanhã às 14:00"
  duration={3000}
  position="top-right"
  onDismiss={() => dismiss()}
/>
```

**Positions**: top-right | top-left | bottom-right | bottom-left
**Actions**: Primary and secondary action buttons

---

### LoadingSpinner
Indicador de carregamento.

```jsx
<LoadingSpinner size="md" color="amber-500" />

<LoadingSpinner fullPage message="Carregando..." />
```

**Tamanhos**: xs | sm | md | lg
**FullPage**: Overlay com mensagem

---

### EmptyState
Estado vazio.

```jsx
<EmptyState
  icon={<Calendar className="w-16 h-16" />}
  title="Nenhum agendamento encontrado"
  description="Crie seu primeiro agendamento para começar"
  actionText="Novo Agendamento"
  onAction={handleCreate}
/>
```

---

### Modal
Modal dialog.

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Novo Cliente"
  size="lg"
>
  <ModalBody>
    <Input label="Nome" />
    <Input label="E-mail" />
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancelar
    </Button>
    <Button onClick={handleSave}>Salvar</Button>
  </ModalFooter>
</Modal>
```

**Tamanhos**: sm | md | lg | xl | full
**Features**: Close on escape, close on overlay click

---

### ConfirmDialog
Modal de confirmação.

```jsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Excluir Cliente?"
  message="Esta ação não pode ser desfeita."
  confirmText="Sim, excluir"
  cancelText="Cancelar"
  variant="danger"
/>
```

**Variants**: default | danger

---

## Resumo por Categoria

| Categoria | Componentes |
|-----------|-------------|
| Data Display | StatCard, DataTable, CardList, Badge, Avatar |
| Form Elements | Input, Select, DatePicker, PhoneInput, Toggle, Checkbox/Radio, SearchBox |
| Navigation & Actions | Button, IconButton, ButtonGroup, Tabs, Breadcrumbs, Dropdown, Pagination |
| Feedback & Overlays | Alert, Toast, LoadingSpinner, EmptyState, Modal, ConfirmDialog |

---

**Última atualização:** 2026-02-25  
**Versão:** 1.0.0
