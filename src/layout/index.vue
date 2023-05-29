<template>
    <div :class="$style.layout">
        <!-- <div :class="$style.head">Head</div> -->
        <router-view v-slot="{ Component }" :class="$style.middle">
            <component :is="Component"></component>
        </router-view>
        <!-- <div :class="$style.footer">Footer</div> -->
    </div>
</template>

<script setup lang="ts">
const $style = useCssModule()
</script>

<style module lang="scss">
.main {
    text-align: center;
    display: flex;
    flex-direction: column;
    height: 100vh;

    .head {
        background-color: greenyellow;
        height: 100px;
    }

    .middle {
        flex: 1;
    }

    .footer {
        background-color: skyblue;
        height: 100px;
    }
}
</style>