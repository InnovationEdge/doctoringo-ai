import { ComponentType } from 'react'

export type RouteType = {
    readonly exact?: boolean
    readonly path: string
    readonly isPublic: boolean
    readonly element: ComponentType
}

export enum LanguageType {
    GEO = 1,
    ENG = 2,
    RUS = 3
}
