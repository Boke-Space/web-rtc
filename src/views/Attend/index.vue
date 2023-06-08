<template>
    <div class="container">
        <div>
            <div class="dialog-inner-container">
                <el-form :model="formInline" ref="ruleForm" label-width="80px" style="width: 300px">
                    <el-form-item label="房间号" prop="roomId">
                        <el-input style="width:220px " v-model="formInline.roomId" placeholder="房间号"></el-input>
                    </el-form-item>
                    <el-form-item label="用户名" prop="nickname">
                        <el-input style="width:220px " v-model="formInline.nickname" placeholder="展示昵称"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button style="margin-left: 70px;" type="warning" @click="joinRoom">进入</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const router = useRouter()

const formInline = reactive({
    nickname: '',
    roomId: '',
})

function joinRoom() {
    router.push({ 
        path: 'conference',
        query: { roomId: formInline.roomId }
    })
}
</script>

<style scoped>
.container {
    padding-top: 20px;
    height: 90vh;
}

.dialog-inner-container {
    margin-left: 35%;
    margin-top: 5%;
}
</style>