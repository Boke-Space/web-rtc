import { ElMessage } from 'element-plus'

export const successMessage = (content: any) => {
    ElMessage({
        message: `${content}`,
        type: 'success',
    })
}

export const errorMessage = (content: any) => {
    ElMessage({
        message: `${content}`,
        type: 'error',
    })
}
