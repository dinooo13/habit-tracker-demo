import { parseCategoryFilter, type CategoryFilter } from '~/utils/domain/categories'

/**
 * Page-local category filter synced to the `?category=` query param (`all` = param
 * omitted). Not persisted; an invalid param falls back to `all`.
 */
export function useCategoryFilter() {
  const route = useRoute()
  const router = useRouter()

  const categoryFilter = computed<CategoryFilter>({
    get: () => parseCategoryFilter(route.query.category),
    set: (value) => {
      const { category: _omit, ...rest } = route.query
      void router.replace({ query: value === 'all' ? rest : { ...rest, category: value } })
    },
  })

  return { categoryFilter }
}
