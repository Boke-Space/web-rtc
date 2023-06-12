function sortObject(target: object) {
    const object = {}
    Object.keys(target).sort().map(key => object[key] = target[key])
    return JSON.stringify(object)
}

// 对象数组去重
export function uniqueObjectList<T extends object>(list: T[]) {
    const set = new Set<string>()
    for (const item of list) {
        set.add(sortObject(item))
    }
    return [...set].map(item => JSON.parse(item))
}