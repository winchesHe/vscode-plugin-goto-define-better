export default {
  computed: {
    watch() {
      return 'test'
    },
    kkk: {
      get() {
        return '1'
      },
      set() {
        return '2'
      },
    },
  },
  data() {
    const a = 1
    function c() {
      return 'tst'
    }

    return {
      a,
      b: ['test'],
      c,
    }
  },
  methods: {
    // use $_ for mixins properties
    // https://vuejs.org/v2/style-guide/index.html#Private-property-names-essential
    $_isMobile() {
      const rect = body.getBoundingClientRect()
      return rect.width - 1 < WIDTH
    },
    test(abc: any) {
      const rect = body.getBoundingClientRect()
      return rect.width - 1 < WIDTH
    },
    $_resizeHandler() {
      if (!document.hidden) {
        const isMobile = this.$_isMobile()
        store.dispatch('app/toggleDevice', isMobile ? 'mobile' : 'desktop')

        if (isMobile)
          store.dispatch('app/closeSideBar', { withoutAnimation: true })
      }
    },
  },
}
