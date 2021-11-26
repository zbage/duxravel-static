import {defineComponent, ref, getCurrentInstance, watch} from 'vue'
import {renderNodeList, vExec} from '../Create'
import {request, searchQuick} from '../../utils/request'
import event from '../../utils/event'
import {router, getParams} from '../../utils/router'

// 获取最近的pageContent组件实例
export const getPageContent = (parent) => {
  const parentName = parent?.$options?.name;
  if (parentName === "PageContent") {
    return parent;
  } else if (!parent.$parent) {
    return;
  }
  return getPageContent(parent.$parent);
}


export default defineComponent({
  props: {
    url: {
      type: String,
      default: () => window.location.href
    },
    urlBind: {
      type: Boolean,
      default: false
    },
    editUrl: {
      type: String,
      default: ''
    },
    columns: {
      type: Array,
      default: () => []
    },
    filter: {
      type: Object,
      default: () => (Object)
    },
    'n-params': {
      type: Object,
    },
    select: {
      type: Boolean,
      default: false
    },
    simple: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: 20
    },
  },
  setup(props) {

    // 选中的列
    const checkedRowKeys = ref([])
    // 列表数据
    const data = ref([])
    // 排序字段
    const sort = ref({})

    // 选中的行数
    const checkRow = () => checkedRowKeys.value.length

    /**
     * 默认批量操作方法
     * @param {*} option
     * @param {*} title
     * @param {*} type
     */
    const checkAction = (option, title, type = 'warning') => {
      if (!checkedRowKeys.value.length) {
        window.message.warning('请选择项目后再进行操作！')
        return
      }
      const callback = () => {
        if (typeof option === 'string') {
          option = {
            url: option,
            method: 'POST'
          }
        }
        if (!option.data?.ids) {
          if (typeof option.data === 'undefined') {
            option.data = {}
          }
          option.data.ids = checkedRowKeys.value
        }
        if (!option.method) {
          option.method = 'POST'
        }
        if (!option.urlType) {
          option.urlType = 'absolute'
        }
        if (typeof option.successMsg === 'undefined') {
          option.successMsg = true
        }
        request(option).then(getList)
      }
      if (title) {
        window.dialog[type]({
          title: '操作提醒',
          content: title,
          hideCancel: false,
          onOk: callback
        })
      } else {
        callback()
      }

    }

    const pagination = ref({
      showTotal: !props.simple,
      showJumper: !props.simple,
      showPageSize: !props.simple,
      simple: props.simple,
      total: 0,
      current: 1,
      pageSize: props.limit,
      onChange: page => {
        pagination.value.current = page
        getList(props.filter)
      },
      onPageSizeChange: limit => {
        pagination.value.pageSize = limit
        pagination.value.current = 1
        getList(props.filter)
      }
    })

    // loading显示
    const loading = ref(false)

    // 获取列表
    const getList = (params = {}) => {
      loading.value = true
      searchQuick({
        url: props.url,
        data: {
          ...params,
          _sort: sort.value,
          page: pagination.value.current,
          limit: pagination.value.pageSize
        }
      }, 'data-table').then(res => {
        pagination.value.total = res.total
        pagination.value.pageSize = res.pageSize
        data.value = res.data
        loading.value = false
      }).catch(() => {
        loading.value = false
      })
    }

    // 绑定在page插槽上的数据
    const childData = {
      checkedRowKeys,
      checkRow,
      getList,
      checkAction
    }

    const routerChange = ({params, agree}) => {
      agree === 'routerPush' && getList(params)
    }

    // url自动跟随参数
    if (props.urlBind) {
      // 监听路由参数改变重新获取列表数据
      event.add('router-change', routerChange)

      // 监听筛选
      watch(props.filter, params => {
        // 过滤空参数 并且跳转到这个代参数的路由地址
        router.routerPush(void 0, Object.fromEntries(Object.keys(params).filter(key => params[key] !== null).map(key => [key, params[key]])))
      })

      // 默认跳转到默认的filter选项
      router.routerPush(void 0, Object.fromEntries(Object.keys(props.filter).filter(key => props.filter[key] !== null).map(key => [key, props.filter[key]])))
    } else {
      watch(props.filter, params => {
        // 过滤空参数 并且跳转到这个代参数的路由地址
        getList(params)
      })
      getList(props.filter)
    }

    // 排序
    const sorter = ({columnKey, sorter, order}) => {

      console.log('sort1', columnKey)
      console.log('sort2', sorter)
      console.log('sort3', order)
      if (sorter === true) {
        if (!order) {
          sort.value = {}
        } else {
          sort.value = {}
          sort.value[columnKey] = order === 'ascend' ? 'asc' : 'desc'
        }
      }
      getList(props.filter)
    }

    const editStatus = ref({
      status: false
    })
    // 默认修改数据方法
    const editValue = (url = this.editUrl, data, index) => {
      if (editStatus.value.status) {
        return
      }
      editStatus.value = {
        status: true,
        data,
        index
      }
      request({
        url,
        urlType: 'absolute',
        method: 'post',
        data
      }).finally(() => {
        editStatus.value = {
          status: false
        }
      })
    }

    const colSortable = ref({
      sortDirections: ['ascend', 'descend'],
      sorter: () => {
        console.log('ddd')
      }
    })


    return {
      sorter,
      colSortable,
      pagination,
      childData,
      data,
      loading,
      columnsRender: props.columns.map(item => vExec.call({}, item, {editValue, editStatus})),
      getList,
      routerChange,
      checkedRowKeys,
    }
  },

  beforeUnmount() {
    event.remove('router-change', this.routerChange)
  },

  render() {
    return <div class="relative">
      <a-table
        loading={this.loading}
        remote={true}
        {...vExec.call(this, this.nParams)}
        pagination={this.pagination}
        data={this.data}
        columns={this.columnsRender}
        rowSelection={this.select ? {
          type: 'checkbox',
          selectedRowKeys: this.checkedRowKeys,
          showCheckedAll: true
        } : false}
        //onSorterChange={this.sorter}
        onSelectionChange={value => {
          this.checkedRowKeys = value
        }}
      />
      <div class="absolute bottom-0 z-10 ">
        {this.$slots.footer?.(this.childData)}
      </div>
    </div>

  }
})
