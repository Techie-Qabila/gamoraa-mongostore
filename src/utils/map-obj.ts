const isObject = (value: any) => typeof value === 'object' && value !== null

// Customized for this use-case
const isObjectCustom = (value: any) =>
    isObject(value) &&
    !(value instanceof RegExp) &&
    !(value instanceof Error) &&
    !(value instanceof Date)

const mapObject = (
    object: any,
    mapper: any,
    options: any,
    isSeen = new WeakMap()
) => {
    options = {
        deep: false,
        target: {},
        ...options,
    }

    if (isSeen.has(object)) {
        return isSeen.get(object)
    }

    isSeen.set(object, options.target)

    const { target } = options
    delete options.target

    const mapArray = (array: any) =>
        array.map((element: any) =>
            isObjectCustom(element)
                ? mapObject(element, mapper, options, isSeen)
                : element
        )
    if (Array.isArray(object)) {
        return mapArray(object)
    }

    for (const [key, value] of Object.entries(object)) {
        let [newKey, newValue] = mapper(key, value, object)

        if (options.deep && isObjectCustom(newValue)) {
            newValue = Array.isArray(newValue)
                ? mapArray(newValue)
                : mapObject(newValue, mapper, options, isSeen)
        }

        target[newKey] = newValue
    }

    return target
}

export function mapObj(object: any, mapper: any, options: any) {
    if (!isObject(object)) {
        throw new TypeError(
            `Expected an object, got \`${object}\` (${typeof object})`
        )
    }

    return mapObject(object, mapper, options)
}

const transform = (input: any, transformFunc: Function, opts: any) => {
    return mapObj(
        input,
        (key: any, val: any) => {
            const newKey = transformFunc(key)

            return [newKey, val]
        },
        { deep: opts.deep }
    )
}

export function transformObjKeys(
    input: any,
    transformFunc: Function,
    opts: any
) {
    return Array.isArray(input)
        ? Object.keys(input).map(key =>
              transform(input[key as any], transformFunc, opts)
          )
        : transform(input, transformFunc, opts)
}
