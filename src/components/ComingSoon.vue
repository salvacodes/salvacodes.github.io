<script setup lang="ts">
const terminalLines = [
  { label: 'Status', value: 'System Initializing...', color: 'text-emerald-500' },
  { label: 'Phase', value: 'Brainstorming...', color: 'text-sky-500' },
  { label: 'Security', value: 'Hardening...', color: 'text-amber-500' }
]
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 font-mono">
    <div class="w-full max-w-md space-y-8">
      <div class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div class="flex items-center gap-2 bg-zinc-800 px-4 py-2">
          <div class="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20"></div>
          <div class="h-3 w-3 rounded-full border border-amber-500/50 bg-amber-500/20"></div>
          <div class="h-3 w-3 rounded-full border border-emerald-500/50 bg-emerald-500/20"></div>
          <span class="ml-2 text-xs text-zinc-500">salva.codes --v0.0.1-alpha</span>
        </div>

        <div class="space-y-3 p-6">
          <div v-for="line in terminalLines" :key="line.label" class="grid grid-cols-[100px_1fr] gap-2">
            <span class="text-zinc-500">[{{ line.label }}]</span>
            <span :class="[line.color, line.label === 'Status' ? 'animate-pulse' : '']">
              {{ line.value }}
            </span>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <span class="text-emerald-500">➜</span>
            <div class="flex items-center gap-2">
              <span class="text-zinc-100">tail -f progress.log</span>
              <span class="h-5 w-2 animate-pulse bg-emerald-500"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center">
        <h1 class="text-xl font-bold tracking-widest text-zinc-100 uppercase">salva.codes</h1>
        <p class="mt-2 text-xs tracking-widest text-zinc-500 uppercase">Coming soon&trade;</p>
      </div>
    </div>
  </div>
</template>
