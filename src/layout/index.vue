<template>
    <div>
        <div>Head</div>
        <router-view v-slot="{ Component }">
            <component :is="Component"></component>
        </router-view>
        <div>Footer</div>
    </div>
</template>

<script setup lang="ts">

</script>

<style module></style>