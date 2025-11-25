# Frontend Source Code

This folder contains all Vue.js frontend code for the application.

## Structure

```
frontend/
├── components/          # Reusable Vue components
│   ├── common/         # Shared components (buttons, inputs, etc.)
│   ├── inventory/      # Inventory-specific components
│   ├── pos/           # POS-specific components
│   ├── employee/      # Employee management components
│   └── reports/       # Report components
├── views/              # Page-level components
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   ├── InventoryView.vue
│   ├── POSView.vue
│   ├── EmployeeView.vue
│   ├── MenuView.vue
│   └── ReportsView.vue
├── store/              # Vuex state management
│   ├── modules/       # Vuex modules for each feature
│   └── index.js       # Main store
├── router/             # Vue Router configuration
│   └── index.js
├── assets/             # Static assets (CSS, images)
│   ├── styles/
│   └── images/
├── composables/        # Reusable Vue composition functions
└── utils/              # Helper functions

```

## Component Guidelines

- Use **Composition API** with `<script setup>`
- Keep components under 200 lines
- Use **Tailwind CSS** for styling
- Follow **PascalCase** for component names

## Example Component

```vue
<template>
  <div class="p-4 bg-white rounded shadow">
    <h2 class="text-xl font-bold">{{ title }}</h2>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
});
</script>
```

## State Management

Use Vuex modules for:
- User authentication state
- Inventory data
- POS cart state
- Employee data

## Team Responsibilities

- **Andrew Puig**: UI components and views
- **Jorge Carmenate**: Component integration
- **Andreani Pineda**: Component testing
