import React from 'react';
import * as AntdIcons from '@ant-design/icons';
import { createSvgIconComponent, sanitizeAndFormatSvg } from '../utils/svg-helper';
import { parseIconValue } from '../utils/icon-style-helper';
import subCategoriesPreset from '../config/sub-categories.json';

// 安全获取宿主环境的 registerIcon 与 icons Map（支持 client 与 client-v2 双架构，杜绝 external 未注入时抛出 TypeError: Cannot read properties of undefined (reading 'icons')）
export function getRuntimeIconRegistry(): { registerIcon?: (name: string, comp: any) => void; icons?: any } {
  if (typeof window !== 'undefined') {
    const deps = (window as any).__nocobase_app_dev_deps__;
    if (deps?.['@nocobase/client-v2']?.icons || deps?.['@nocobase/client-v2']?.registerIcon) {
      return {
        registerIcon: deps['@nocobase/client-v2'].registerIcon,
        icons: deps['@nocobase/client-v2'].icons,
      };
    }
    if (deps?.['@nocobase/client']?.icons || deps?.['@nocobase/client']?.registerIcon) {
      return {
        registerIcon: deps['@nocobase/client'].registerIcon,
        icons: deps['@nocobase/client'].icons,
      };
    }
  }
  return {};
}

export function safeRegisterIcon(name: string, comp: any) {
  const { registerIcon } = getRuntimeIconRegistry();
  if (typeof registerIcon === 'function') {
    try {
      registerIcon(name, comp);
    } catch (e) {}
  }
}

export function getSafeIconsMap(): any {
  const { icons } = getRuntimeIconRegistry();
  return icons;
}

export interface CustomIconItem {
  id?: number | string;
  name: string;
  title?: string;
  category?: string;
  svg: string;
  source?: string;
  sort?: number;
}

type Listener = () => void;

export interface IconPaginationConfig {
  enablePagination: boolean;
  threshold: number;
  pageSize: number;
  marketPreviewCount?: number;
  popoverWidth?: string;
}

export const DEFAULT_PAGINATION_CONFIG: IconPaginationConfig = {
  enablePagination: true,
  threshold: 500,
  pageSize: 200,
  marketPreviewCount: 10,
  popoverWidth: 'wide',
};

export interface RawSubCategoryConfig {
  key: string;
  label: string;
  matchType?: 'regex' | 'endsWith' | 'notEndsWith' | 'all';
  pattern?: string;
}

export interface SubCategoryDef {
  key: string;
  label: string;
  filter: (name: string, item?: any) => boolean;
}

export function parseSubCategoryRules(rawList: RawSubCategoryConfig[] = []): SubCategoryDef[] {
  return (rawList || []).map((item) => {
    if (!item.matchType || item.matchType === 'all' || !item.pattern) {
      return { key: item.key, label: item.label, filter: () => true };
    }
    if (item.matchType === 'endsWith') {
      const p = item.pattern;
      return { key: item.key, label: item.label, filter: (n: string) => n.endsWith(p) };
    }
    if (item.matchType === 'notEndsWith') {
      const p = item.pattern;
      return { key: item.key, label: item.label, filter: (n: string) => !n.endsWith(p) };
    }
    if (item.matchType === 'regex') {
      try {
        const reg = new RegExp(item.pattern, 'i');
        return { key: item.key, label: item.label, filter: (n: string) => reg.test(n) };
      } catch (e) {
        return { key: item.key, label: item.label, filter: () => true };
      }
    }
    return { key: item.key, label: item.label, filter: () => true };
  });
}

const CACHE_KEY = 'NOCOBASE_CUSTOM_ICONS_CACHE_V2';
const STYLED_CACHE_KEY = 'NOCOBASE_STYLED_ICONS_CACHE_V2';
const PAGINATION_CONFIG_KEY = 'NOCOBASE_ICON_PAGINATION_CONFIG_V2';
const SUB_CATEGORIES_CONFIG_KEY = 'NOCOBASE_SUB_CATEGORIES_CONFIG_V2';

/**
 * Ant Design 官方全量图标组件映射字典（大小写不敏感索引，确保首屏及任意时刻 100% 命中）
 */
export const antdIconsDict = new Map<string, React.ComponentType<any>>();
try {
  Object.keys(AntdIcons).forEach((key) => {
    const comp = (AntdIcons as any)[key];
    if (comp && (typeof comp === 'function' || typeof comp === 'object')) {
      antdIconsDict.set(key.toLowerCase(), comp);
      antdIconsDict.set(key, comp);
    }
  });
} catch (e) {
  // ignore
}

/**
 * 全局拦截并代理增强 icons Map 实例
 * 拦截 has 与 get，使系统各处渲染带 ? 复合样式的图标时可透明即时解析并生成对应包装组件
 */
export function patchIconsMap(targetMap: any, manager?: any) {
  if (!targetMap || targetMap.__nb_styled_patched__) {
    return targetMap;
  }
  targetMap.__nb_styled_patched__ = true;

  const originalHas = typeof targetMap.has === 'function' ? targetMap.has.bind(targetMap) : () => false;
  const originalGet = typeof targetMap.get === 'function' ? targetMap.get.bind(targetMap) : () => undefined;

  targetMap.has = function (key: any): boolean {
    if (originalHas(key)) {
      return true;
    }
    if (typeof key === 'string') {
      const lowerKey = key.toLowerCase();
      if (originalHas(lowerKey)) {
        return true;
      }
      if (key.includes('?')) {
        const { name: baseName } = parseIconValue(key);
        if (baseName) {
          const lowerBase = baseName.toLowerCase();
          const mgr = manager || customIconsManager;
          if (
            originalHas(lowerBase) ||
            originalHas(baseName) ||
            mgr?.getIcon?.(lowerBase) ||
            antdIconsDict.has(lowerBase)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  targetMap.get = function (key: any): any {
    let comp = originalGet(key);
    if (comp) {
      return comp;
    }
    if (typeof key === 'string') {
      const lowerKey = key.toLowerCase();
      comp = originalGet(lowerKey);
      if (comp) {
        return comp;
      }
      if (key.includes('?')) {
        const mgr = manager || customIconsManager;
        if (mgr && typeof mgr.registerStyledIcon === 'function') {
          const styledComp = mgr.registerStyledIcon(key);
          if (styledComp) {
            return styledComp;
          }
        }
      }
    }
    return undefined;
  };

  return targetMap;
}

// 模块加载瞬间尝试拦截当前作用域的 icons Map（安全容错）
try {
  const map = getSafeIconsMap();
  if (map && typeof map.has === 'function') {
    patchIconsMap(map);
  }
} catch (e) {}

export const PRESET_COMMON_ICONS: CustomIconItem[] = [
  {
    name: 'preset:dashboard',
    title: '运营看板',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>',
  },
  {
    name: 'preset:analytics',
    title: '数据分析',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>',
  },
  {
    name: 'preset:flow-chart',
    title: '业务流转',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"></rect><rect x="15" y="15" width="6" height="6" rx="1"></rect><path d="M6 9v3a3 3 0 0 0 3 3h6"></path><path d="M15 12l3 3-3 3"></path></svg>',
  },
  {
    name: 'preset:rocket-deploy',
    title: '发布部署',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path></svg>',
  },
  {
    name: 'preset:shield-security',
    title: '安全管控',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  },
  {
    name: 'preset:database-storage',
    title: '数据仓库',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
  },
  {
    name: 'preset:user-cog',
    title: '用户权限',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  },
  {
    name: 'preset:file-text',
    title: '合同档案',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
  },
  {
    name: 'preset:sparkles-ai',
    title: '智能助手',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>',
  },
  {
    name: 'preset:bell-notify',
    title: '站内消息',
    category: '精选库',
    svg: '<svg viewBox="0 0 24 24" style="fill: none !important;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  },
];

class CustomIconsManager {
  private static instance: CustomIconsManager;
  private icons: CustomIconItem[] = [];
  private categories: string[] = ['custom'];
  private listeners: Set<Listener> = new Set();
  private isLoaded = false;
  private apiClient: any = null;
  private app: any = null;
  private hostIconComponent: any = null;
  private registeredComponents: Map<string, any> = new Map();
  private paginationConfig: IconPaginationConfig = { ...DEFAULT_PAGINATION_CONFIG };
  private subCategoriesConfig: Record<string, RawSubCategoryConfig[]> = (subCategoriesPreset as any) || {};

  private constructor() {
    // 绑定核心实例方法，防止解构或作为回调传递时丢失 this
    this.getAllIcons = this.getAllIcons.bind(this);
    this.getCategories = this.getCategories.bind(this);
    this.getIcon = this.getIcon.bind(this);
    this.getPaginationConfig = this.getPaginationConfig.bind(this);
    this.getSubCategoriesConfig = this.getSubCategoriesConfig.bind(this);
    this.getSubCategories = this.getSubCategories.bind(this);
    this.deleteIcon = this.deleteIcon.bind(this);
    this.loadIcons = this.loadIcons.bind(this);
    this.saveIcon = this.saveIcon.bind(this);
    this.updateIcon = this.updateIcon.bind(this);

    // 1. 挂载当前环境的 icons Map 代理拦截器
    try {
      const map = getSafeIconsMap();
      if (map && typeof map.has === 'function') {
        patchIconsMap(map, this);
      }
    } catch (e) {}

    // 2. 初始化时同步注册内置预设图标，确保首屏零延迟
    this.registerPresetIcons();

    // 3. 尝试从 localStorage 恢复已缓存的自定义图标，实现首屏毫秒级预热
    this.restoreFromLocalStorage();

    // 4. 同步从 localStorage 恢复已使用过的带样式复合图标，首屏 0 毫秒就绪
    this.restoreStyledIconsFromCache();

    // 5. 从 localStorage 恢复分页配置
    this.restorePaginationConfigFromCache();

    // 6. 从 localStorage 恢复分类规则配置
    this.restoreSubCategoriesConfigFromCache();

    // 7. 启动后台主应用宿主 Icon 探测器
    this.scheduleHostIconDetection();
  }

  public static getInstance(): CustomIconsManager {
    if (!CustomIconsManager.instance) {
      CustomIconsManager.instance = new CustomIconsManager();
    }
    return CustomIconsManager.instance;
  }

  public setApiClient(client: any) {
    this.apiClient = client;
  }

  public setApp(app: any) {
    this.app = app;
    this.detectHostIcon();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('CustomIconsManager listener error:', err);
      }
    });
  }

  /**
   * 同步注册精选预设图标
   */
  private registerPresetIcons() {
    PRESET_COMMON_ICONS.forEach((item) => {
      this.registerToAllEngines(item.name, item.svg);
    });
  }

  /**
   * 从 localStorage 中恢复缓存的图标并预注册
   */
  private restoreFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cachedList: CustomIconItem[] = JSON.parse(raw);
        if (Array.isArray(cachedList) && cachedList.length > 0) {
          this.icons = cachedList;
          cachedList.forEach((item) => {
            if (item.name && item.svg) {
              this.registerToAllEngines(item.name, item.svg);
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * 将当前图标缓存写入 localStorage
   */
  private saveToLocalStorage(items: CustomIconItem[]) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }

  /**
   * 将复合图标持久化到 localStorage（防刷新后丢失）
   */
  public saveStyledIconToCache(formattedValue: string) {
    if (typeof window === 'undefined' || !window.localStorage || !formattedValue) return;
    try {
      const str = String(formattedValue).trim();
      if (!str.includes('?')) return;
      const raw = window.localStorage.getItem(STYLED_CACHE_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(str)) {
        list.push(str);
        if (list.length > 500) list.shift();
        window.localStorage.setItem(STYLED_CACHE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * 从 localStorage 恢复所有使用过的复合图标并同步预热注册
   */
  private restoreStyledIconsFromCache() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(STYLED_CACHE_KEY);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((val) => {
            if (val && typeof val === 'string' && val.includes('?')) {
              this.registerStyledIcon(val, false);
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * 从 localStorage 恢复分页配置
   */
  private restorePaginationConfigFromCache() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(PAGINATION_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.paginationConfig = {
          enablePagination: parsed.enablePagination !== false,
          threshold: typeof parsed.threshold === 'number' ? parsed.threshold : 500,
          pageSize: typeof parsed.pageSize === 'number' ? parsed.pageSize : 200,
          marketPreviewCount: typeof parsed.marketPreviewCount === 'number' ? parsed.marketPreviewCount : 10,
          popoverWidth: typeof parsed.popoverWidth === 'string' && parsed.popoverWidth ? parsed.popoverWidth : 'wide',
        };
      }
    } catch (e) {}
  }

  /**
   * 获取当前分页配置
   */
  public getPaginationConfig(): IconPaginationConfig {
    return { ...this.paginationConfig };
  }

  /**
   * 从服务端拉取最新分页配置
   */
  public async loadPaginationConfig(client?: any): Promise<IconPaginationConfig> {
    const api = client || this.apiClient;
    if (!api) return this.paginationConfig;
    try {
      const res = await api.request({
        url: 'customIconRepos:getSettings',
      });
      const data = res?.data?.data || res?.data;
      if (data && typeof data === 'object') {
        this.paginationConfig = {
          enablePagination: data.enablePagination !== false,
          threshold: typeof data.threshold === 'number' ? data.threshold : 500,
          pageSize: typeof data.pageSize === 'number' ? data.pageSize : 200,
          marketPreviewCount: typeof data.marketPreviewCount === 'number' ? data.marketPreviewCount : 10,
          popoverWidth: typeof data.popoverWidth === 'string' && data.popoverWidth ? data.popoverWidth : 'wide',
        };
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(PAGINATION_CONFIG_KEY, JSON.stringify(this.paginationConfig));
          } catch (e) {}
        }
        this.notify();
      }
    } catch (e) {
      // ignore
    }
    return this.paginationConfig;
  }

  /**
   * 保存并广播分页配置
   */
  public async savePaginationConfig(config: Partial<IconPaginationConfig>, client?: any): Promise<IconPaginationConfig> {
    const api = client || this.apiClient;
    const nextConfig: IconPaginationConfig = {
      enablePagination: config.enablePagination !== undefined ? Boolean(config.enablePagination) : this.paginationConfig.enablePagination,
      threshold: typeof config.threshold === 'number' ? Math.max(0, config.threshold) : this.paginationConfig.threshold,
      pageSize: typeof config.pageSize === 'number' ? Math.max(10, config.pageSize) : this.paginationConfig.pageSize,
      marketPreviewCount:
        typeof config.marketPreviewCount === 'number'
          ? Math.min(30, Math.max(1, config.marketPreviewCount))
          : (this.paginationConfig.marketPreviewCount || 10),
      popoverWidth:
        typeof config.popoverWidth === 'string' && config.popoverWidth.trim()
          ? config.popoverWidth.trim()
          : (this.paginationConfig.popoverWidth || 'wide'),
    };
    this.paginationConfig = nextConfig;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(PAGINATION_CONFIG_KEY, JSON.stringify(nextConfig));
      } catch (e) {}
    }
    this.notify();

    if (api) {
      try {
        await api.request({
          url: 'customIconRepos:saveSettings',
          method: 'post',
          data: {
            ...nextConfig,
            subCategories: this.subCategoriesConfig,
          },
        });
      } catch (e) {
        console.warn('Failed to save pagination settings to server:', e);
      }
    }
    return nextConfig;
  }

  /**
   * 从 localStorage 恢复分类规则配置
   */
  private restoreSubCategoriesConfigFromCache() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(SUB_CATEGORIES_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.subCategoriesConfig = {
            ...((subCategoriesPreset as any) || {}),
            ...parsed,
          };
        }
      }
    } catch (e) {}
  }

  /**
   * 获取子分类完整配置字典
   */
  public getSubCategoriesConfig(): Record<string, RawSubCategoryConfig[]> {
    return {
      ...((subCategoriesPreset as any) || {}),
      ...this.subCategoriesConfig,
    };
  }

  /**
   * 根据当前大分类/图库 key 获取对应解析后的子分类定义列表
   */
  public getSubCategories(categoryKey?: string): SubCategoryDef[] {
    const config = this.getSubCategoriesConfig();
    const key = categoryKey || 'universal';

    // 1. 如果配置中存在该图库的专有规则
    if (config[key] && Array.isArray(config[key]) && config[key].length > 0) {
      return parseSubCategoryRules(config[key]);
    }

    // 2. 如果是系统内置 Ant Design 图标
    if (['builtin', 'outlined', 'filled', 'twotone'].includes(key.toLowerCase())) {
      return parseSubCategoryRules(config['builtin'] || (subCategoriesPreset as any)?.builtin || []);
    }

    // 3. 默认通用规则
    return parseSubCategoryRules(config['universal'] || (subCategoriesPreset as any)?.universal || []);
  }

  /**
   * 从服务端拉取最新分类规则配置
   */
  public async loadSubCategoriesConfig(client?: any): Promise<Record<string, RawSubCategoryConfig[]>> {
    const api = client || this.apiClient;
    if (!api) return this.getSubCategoriesConfig();
    try {
      const res = await api.request({
        url: 'customIconRepos:getSettings',
      });
      const data = res?.data?.data || res?.data;
      if (data && data.subCategories && typeof data.subCategories === 'object') {
        this.subCategoriesConfig = {
          ...((subCategoriesPreset as any) || {}),
          ...data.subCategories,
        };
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(SUB_CATEGORIES_CONFIG_KEY, JSON.stringify(this.subCategoriesConfig));
          } catch (e) {}
        }
        this.notify();
      }
    } catch (e) {
      // ignore
    }
    return this.getSubCategoriesConfig();
  }

  /**
   * 保存并广播分类规则配置
   */
  public async saveSubCategoriesConfig(
    config: Record<string, RawSubCategoryConfig[]>,
    client?: any,
  ): Promise<Record<string, RawSubCategoryConfig[]>> {
    const api = client || this.apiClient;
    this.subCategoriesConfig = { ...config };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SUB_CATEGORIES_CONFIG_KEY, JSON.stringify(this.subCategoriesConfig));
      } catch (e) {}
    }
    this.notify();

    if (api) {
      try {
        await api.request({
          url: 'customIconRepos:saveSettings',
          method: 'post',
          data: {
            ...this.paginationConfig,
            subCategories: this.subCategoriesConfig,
          },
        });
      } catch (e) {
        console.warn('Failed to save sub-categories settings to server:', e);
      }
    }
    return this.getSubCategoriesConfig();
  }

  /**
   * 重置分类规则配置为系统默认预设
   */
  public async resetSubCategoriesConfig(client?: any): Promise<Record<string, RawSubCategoryConfig[]>> {
    const defaultPreset = (subCategoriesPreset as any) || {};
    return this.saveSubCategoriesConfig(defaultPreset, client);
  }

  /**
   * 探测主应用的 Icon 组件与全局 icons Map（打通主应用与插件的多实例隔离）
   * 采用多级捕获策略：
   * 1. 从菜单项标题及容器向上回溯 React Fiber 树（精准、快速，耗时 < 1ms）
   * 2. 从 React 根容器 (#root) 广度优先搜索 Fiber 树
   * 3. 从系统 app 实例及 Webpack 模块中检索
   */
  public detectHostIcon(): any {
    if (this.hostIconComponent && typeof this.hostIconComponent.register === 'function') {
      return this.hostIconComponent;
    }

    if (typeof window === 'undefined') return null;

    let targetPO: any = null;

    // 途径 1: 从已渲染的菜单项/标题向上遍历 React Fiber 树
    try {
      const menuTitles = Array.from(
        document.querySelectorAll(
          '.ant-pro-base-menu-horizontal-item-title, .ant-pro-base-menu-inline-item-title, .ant-menu-item, [class*="ant-pro-base-menu"]'
        )
      );
      for (const el of menuTitles) {
        const fiberKey = Object.keys(el).find(
          (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
        );
        if (fiberKey) {
          let curr = (el as any)[fiberKey];
          let depth = 0;
          while (curr && depth < 30) {
            const iconType = curr.memoizedProps?.item?.icon?.type || curr.memoizedProps?.icon?.type;
            if (iconType && typeof iconType.register === 'function') {
              targetPO = iconType;
              break;
            }
            curr = curr.return;
            depth++;
          }
        }
        if (targetPO) break;
      }
    } catch (e) {}

    // 途径 2: 从 React 根节点 (#root) 广度优先搜索 Fiber 树
    if (!targetPO) {
      try {
        const root = document.getElementById('root') || document.body;
        if (root) {
          const fiberKey = Object.keys(root).find(
            (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactContainer$')
          );
          if (fiberKey) {
            let rootFiber = (root as any)[fiberKey];
            if (rootFiber?.current) rootFiber = rootFiber.current;
            const queue = [rootFiber];
            let count = 0;
            while (queue.length > 0 && count < 3000) {
              const node = queue.shift();
              count++;
              if (!node) continue;
              if (
                typeof node.type === 'function' &&
                typeof node.type.register === 'function' &&
                typeof node.type.createFromIconfontCN === 'function'
              ) {
                targetPO = node.type;
                break;
              }
              const iconType = node.memoizedProps?.item?.icon?.type || node.memoizedProps?.icon?.type;
              if (iconType && typeof iconType.register === 'function') {
                targetPO = iconType;
                break;
              }
              if (node.child) queue.push(node.child);
              if (node.sibling) queue.push(node.sibling);
            }
          }
        }
      } catch (e) {}
    }

    // 途径 3: 从 app 实例上检查
    if (!targetPO && this.app) {
      if (this.app.components?.Icon?.register) {
        targetPO = this.app.components.Icon;
      }
    }

    // 成功命中主应用核心 Icon 组件！
    if (targetPO && typeof targetPO.register === 'function') {
      this.hostIconComponent = targetPO;
      this.flushToHostIcon();
    }

    return this.hostIconComponent;
  }

  /**
   * 极速与持续高频探测调度，确保在首屏网络返回前、React 挂载就绪后第一时间同步主应用
   */
  public scheduleHostIconDetection() {
    if (typeof window === 'undefined') return;
    const delays = [20, 60, 150, 300, 600, 1200, 2500, 4500];
    delays.forEach((delay) => {
      setTimeout(() => {
        this.detectHostIcon();
        this.compensateDomIcons();
      }, delay);
    });
  }

  /**
   * 将当前所有已生成的组件批量注入到主应用 Host Icon
   */
  public flushToHostIcon() {
    if (!this.hostIconComponent || typeof this.hostIconComponent.register !== 'function') return;
    const batchObj: Record<string, any> = {};
    this.registeredComponents.forEach((comp, nameKey) => {
      batchObj[nameKey] = comp;
      batchObj[nameKey.toLowerCase()] = comp;
    });
    try {
      this.hostIconComponent.register(batchObj);
    } catch (e) {
      console.warn('Failed to flush custom icons to host Icon:', e);
    }
  }

  /**
   * DOM 级图标自动巡检与兜底渲染补偿
   * 若因首屏时差导致 ProLayout 图标 span 为空，立即解析数据并直接将自适应矢量图标注入挂载
   */
  public compensateDomIcons() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      const titles = Array.from(
        document.querySelectorAll(
          '.ant-pro-base-menu-horizontal-item-title, .ant-pro-base-menu-inline-item-title'
        )
      );
      if (titles.length === 0) return;

      titles.forEach((el) => {
        const iconSpan = el.querySelector(
          '.ant-pro-base-menu-horizontal-item-icon, .ant-pro-base-menu-inline-item-icon'
        ) as HTMLElement | null;
        if (!iconSpan) return;

        // 如果容器已经渲染了子节点，跳过
        if (iconSpan.childNodes.length > 0 && (iconSpan.querySelector('svg') || iconSpan.querySelector('.anticon'))) {
          return;
        }

        // 获取该菜单项的 Fiber 数据
        const fiberKey = Object.keys(el).find(
          (k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
        );
        if (!fiberKey) return;
        let curr = (el as any)[fiberKey];
        let item: any = null;
        while (curr) {
          if (curr.memoizedProps?.item) {
            item = curr.memoizedProps.item;
            break;
          }
          curr = curr.return;
        }

        const iconVal = item?.icon?.props?.type || (typeof item?.icon === 'string' ? item.icon : null);
        if (!iconVal || typeof iconVal !== 'string') return;

        // 1. 确保在组件字典及主应用 PO 中已就绪
        let Comp = this.registeredComponents.get(iconVal.toLowerCase());
        if (!Comp) {
          if (iconVal.includes('?')) {
            Comp = this.registerStyledIcon(iconVal);
          } else {
            const custom = this.getIcon(iconVal);
            if (custom && custom.svg) {
              Comp = this.registerToAllEngines(iconVal, custom.svg);
            } else {
              Comp = antdIconsDict.get(iconVal.toLowerCase()) || antdIconsDict.get(iconVal);
            }
          }
        }

        if (this.hostIconComponent && typeof this.hostIconComponent.register === 'function' && Comp) {
          try {
            this.hostIconComponent.register({
              [iconVal]: Comp,
              [iconVal.toLowerCase()]: Comp,
            });
          } catch (e) {}
        }

        // 2. 检查 DOM 容器是否仍为空，若为空立即渲染并挂载矢量节点
        if (iconSpan.childNodes.length === 0) {
          const { name: baseName, color, size } = parseIconValue(iconVal);
          const cleanBase = (baseName || iconVal).trim();
          const customItem = this.getIcon(cleanBase);

          let svgHtml = '';
          if (customItem && customItem.svg) {
            svgHtml = sanitizeAndFormatSvg(customItem.svg);
          }

          const span = document.createElement('span');
          span.className = 'anticon anticon-custom-compensated';
          span.setAttribute('role', 'img');
          span.setAttribute('aria-label', cleanBase);
          span.style.display = 'inline-flex';
          span.style.alignItems = 'center';
          span.style.justifyContent = 'center';
          span.style.verticalAlign = '-0.125em';
          span.style.marginRight = '8px';
          if (color) span.style.color = color;
          if (size) span.style.fontSize = size.endsWith('px') || size.endsWith('em') ? size : `${size}px`;

          if (svgHtml) {
            span.innerHTML = svgHtml;
            iconSpan.appendChild(span);
          } else {
            // 如果是 Antd 图标，尝试从已注册组件或宿主渲染
            try {
              if (Comp) {
                // 如果能从 Fiber 中获取 React 并渲染，或者借助现有 DOM
                const lowerBase = cleanBase.toLowerCase();
                // 常见 Antd 官方图标基础 SVG 快速映射
                const antdSvgMap: Record<string, string> = {
                  alipaycircleoutlined: '<svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor"><path d="M1000 600q0 160-120 280t-280 120H200V800h360q80 0 140-60t60-140q0-70-45-125t-115-65l-20-5q-90-20-160-80t-70-165V200h200v160q0 60 45 105t105 45q80 0 140-55t60-135V200h200v200q0 90-70 160t-170 70q70 10 125 55t85 115z"></path></svg>',
                  scanoutlined: '<svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor"><path d="M160 160h200V80H80v280h80V160zm0 704H80v-280h80v200h200v80H160zm704 0h-200v80h280v-280h-80v200zm0-704v200h80V80H664v80h200zM240 512h544v-64H240v64z"></path></svg>',
                };
                if (antdSvgMap[lowerBase]) {
                  span.innerHTML = antdSvgMap[lowerBase];
                  iconSpan.appendChild(span);
                }
              }
            } catch (e) {}
          }
        }
      });
    } catch (e) {}
  }

  /**
   * 核心注册函数：跨模块、跨实例多端同步注册
   */
  public registerToAllEngines(name: string | number, svg: string) {
    if (!name || !svg) return null;
    const strName = String(name).trim();
    const lowerName = strName.toLowerCase();

    // 1. 创建防 React 冲突、自适应样式的组件
    const Comp = createSvgIconComponent(svg, strName);

    // 2. 缓存到本地 Map
    this.registeredComponents.set(strName, Comp);
    this.registeredComponents.set(lowerName, Comp);

    // 3. 注册到当前 client 作用域（安全容错）
    safeRegisterIcon(lowerName, Comp);
    if (lowerName !== strName) {
      safeRegisterIcon(strName, Comp);
    }

    // 4. 同步注册到主应用宿主 Icon 闭包
    const host = this.detectHostIcon();
    if (host && typeof host.register === 'function') {
      try {
        host.register({
          [lowerName]: Comp,
          [strName]: Comp,
        });
      } catch (e) {
        // ignore
      }
    }

    return Comp;
  }

  public getIcon(name: string): CustomIconItem | undefined {
    if (!name) return undefined;
    const clean = String(name).trim().toLowerCase();
    const list = this?.icons || [];
    return list.find((i) => String(i.name).trim().toLowerCase() === clean);
  }

  /**
   * 动态注册带颜色/尺寸的复合图标（首屏自恢复、永不丢失、100% 呈现真实组件）
   */
  public registerStyledIcon(formattedValue: string, persist = true) {
    if (!formattedValue || typeof formattedValue !== 'string') return null;
    const strVal = formattedValue.trim();
    if (!strVal.includes('?')) return null;

    const { name: baseName, color, size } = parseIconValue(strVal);
    if (!baseName) return null;

    const lowerVal = strVal.toLowerCase();
    if (this.registeredComponents.has(lowerVal)) {
      if (persist) {
        this.saveStyledIconToCache(strVal);
      }
      return this.registeredComponents.get(lowerVal);
    }

    if (persist) {
      this.saveStyledIconToCache(strVal);
    }

    const lowerBase = baseName.toLowerCase();
    const isTwoTone = lowerBase.endsWith('twotone');
    const normalizedSize = size
      ? (size.endsWith('px') || size.endsWith('em') || size.endsWith('rem') ? size : `${size}px`)
      : undefined;

    // 1. 如果是自定义 SVG 图标
    const customItem = this.getIcon(baseName);
    if (customItem && customItem.svg) {
      const StyledComp = createSvgIconComponent(customItem.svg, strVal, { color, size });
      this.registeredComponents.set(strVal, StyledComp);
      this.registeredComponents.set(lowerVal, StyledComp);
      safeRegisterIcon(lowerVal, StyledComp);
      safeRegisterIcon(strVal, StyledComp);

      const host = this.detectHostIcon();
      if (host && typeof host.register === 'function') {
        try {
          host.register({ [lowerVal]: StyledComp, [strVal]: StyledComp });
        } catch (e) {}
      }
      return StyledComp;
    }

    // 2. 如果是 Ant Design 图标或者系统内置图标
    // 多渠道强力获取真实组件，确保绝不落空！
    const baseComp =
      this.registeredComponents.get(lowerBase) ||
      getSafeIconsMap()?.get?.(lowerBase) ||
      antdIconsDict.get(lowerBase) ||
      antdIconsDict.get(baseName);

    const StyledWrapper: React.FC<any> = (props: any) => {
      const { style, children, ...rest } = props || {};
      const mergedStyle: React.CSSProperties = {
        ...style,
        ...(color ? { color } : {}),
        ...(normalizedSize ? { fontSize: normalizedSize, width: normalizedSize, height: normalizedSize } : {}),
      };
      const extraProps: any = {};
      if (color && (isTwoTone || rest.twoToneColor !== undefined)) {
        extraProps.twoToneColor = color;
      }
      if (baseComp) {
        return React.createElement(baseComp, { ...rest, ...extraProps, style: mergedStyle }, children);
      }
      // 极端兜底（例如拼写错误的图标名）渲染带颜色的点状提示，防止产生空空白
      return React.createElement(
        'span',
        {
          className: 'anticon enhanced-styled-fallback',
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            ...mergedStyle,
          },
          ...rest,
        },
        children || React.createElement('span', { style: { fontSize: '0.85em', opacity: 0.8 } }, '●'),
      );
    };

    this.registeredComponents.set(strVal, StyledWrapper);
    this.registeredComponents.set(lowerVal, StyledWrapper);
    safeRegisterIcon(lowerVal, StyledWrapper);
    safeRegisterIcon(strVal, StyledWrapper);

    const host = this.detectHostIcon();
    if (host && typeof host.register === 'function') {
      try {
        host.register({ [lowerVal]: StyledWrapper, [strVal]: StyledWrapper });
      } catch (e) {}
    }

    return StyledWrapper;
  }

  /**
   * 从后端拉取所有自定义图标并注册到全局
   */
  public async loadIcons(client?: any) {
    const api = client || this.apiClient;
    if (!api) return;

    try {
      // 优先走免认证的 customIcons:list 路由，若 404/401 则降级回退到 custom_icons:list
      let res: any = null;
      try {
        res = await api.request({
          url: 'customIcons:list',
          params: { paginate: false },
        });
      } catch (e1) {
        res = await api.request({
          url: 'custom_icons:list',
          params: { paginate: false },
        });
      }

      const list: CustomIconItem[] = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length >= 0) {
        this.icons = list;

        // 更新分类列表
        const catSet = new Set<string>();
        catSet.add('custom');
        this.icons.forEach((item) => {
          if (item.category) catSet.add(item.category);
        });
        this.categories = Array.from(catSet);

        // 注册所有图标
        this.icons.forEach((item) => {
          if (item.name && item.svg) {
            this.registerToAllEngines(item.name, item.svg);
          }
        });

        // 保存到 localStorage 缓存供下次刷新首屏预热
        this.saveToLocalStorage(this.icons);

        this.isLoaded = true;
        this.notify();
      }
      // 异步同步最新分页与分类规则配置
      void this.loadPaginationConfig(api);
      void this.loadSubCategoriesConfig(api);
    } catch (err) {
      console.warn('Failed to load custom icons from server, using local cache:', err);
    }
  }

  public getAllIcons(): CustomIconItem[] {
    const list = this?.icons || [];
    return [...list];
  }

  public getCategories(): string[] {
    const cats = this?.categories || ['custom'];
    return [...cats];
  }

  public getIconsByCategory(category: string): CustomIconItem[] {
    if (!category || category === 'all') return this.getAllIcons();
    const list = this?.icons || [];
    return list.filter((item) => (item.category || 'custom') === category);
  }

  /**
   * 新增或保存单个图标
   */
  public async saveIcon(
    iconData: { name: string; title?: string; category?: string; svg: string; source?: string },
    client?: any,
  ): Promise<CustomIconItem> {
    const api = client || this.apiClient;
    if (!api) throw new Error('API Client is not ready');

    const formattedSvg = sanitizeAndFormatSvg(iconData.svg);
    const cleanName = String(iconData.name).trim();
    const payload = {
      ...iconData,
      name: cleanName.toLowerCase(),
      category: iconData.category?.trim() || 'custom',
      svg: formattedSvg,
    };

    let res: any = null;
    try {
      res = await api.request({
        url: 'customIcons:create',
        method: 'post',
        data: payload,
      });
    } catch (e) {
      res = await api.request({
        url: 'custom_icons:create',
        method: 'post',
        data: payload,
      });
    }

    const saved: CustomIconItem = res?.data?.data || res?.data;

    // 全局双向注册
    this.registerToAllEngines(saved.name, saved.svg);

    // 更新本地缓存
    const index = this.icons.findIndex((i) => String(i.name).toLowerCase() === String(saved.name).toLowerCase());
    if (index >= 0) {
      this.icons[index] = saved;
    } else {
      this.icons.unshift(saved);
    }

    if (!this.categories.includes(saved.category || 'custom')) {
      this.categories.push(saved.category || 'custom');
    }

    this.saveToLocalStorage(this.icons);
    this.notify();
    return saved;
  }

  /**
   * 批量导入图标
   */
  public async batchImportIcons(
    items: Array<{ name: string; title?: string; category?: string; svg: string; source?: string }>,
    client?: any,
  ): Promise<number> {
    const api = client || this.apiClient;
    if (!api) throw new Error('API Client is not ready');

    const sanitizedItems = items.map((item) => ({
      ...item,
      name: String(item.name).trim().toLowerCase(),
      category: item.category?.trim() || 'custom',
      svg: sanitizeAndFormatSvg(item.svg),
    }));

    let res: any = null;
    try {
      res = await api.request({
        url: 'customIcons:batchCreate',
        method: 'post',
        data: { items: sanitizedItems },
      });
    } catch (e) {
      res = await api.request({
        url: 'custom_icons:batchCreate',
        method: 'post',
        data: { items: sanitizedItems },
      });
    }

    const count = res?.data?.count || sanitizedItems.length;

    // 重新拉取以确保全量同步
    await this.loadIcons(api);
    return count;
  }

  /**
   * 更新单个图标信息（标题、分类、SVG内容）
   */
  public async updateIcon(
    iconData: { id?: number | string; name: string; title?: string; category?: string; svg?: string },
    client?: any,
  ): Promise<CustomIconItem> {
    const api = client || this.apiClient;
    if (!api) throw new Error('API Client is not ready');

    const formattedSvg = iconData.svg ? sanitizeAndFormatSvg(iconData.svg) : undefined;
    const cleanName = String(iconData.name).trim();
    const payload: any = {
      name: cleanName.toLowerCase(),
      title: iconData.title?.trim() || cleanName,
      category: iconData.category?.trim() || 'custom',
    };
    if (formattedSvg) {
      payload.svg = formattedSvg;
    }

    let res: any = null;
    try {
      res = await api.request({
        url: 'customIcons:update',
        method: 'post',
        params: { filterByTk: iconData.id },
        data: { ...payload, filterByTk: iconData.id },
      });
    } catch (e) {
      res = await api.request({
        url: 'custom_icons:update',
        method: 'post',
        params: { filterByTk: iconData.id },
        data: { ...payload, filterByTk: iconData.id },
      });
    }

    const updated: CustomIconItem = res?.data?.data || res?.data;

    // 重新在系统全局双向注册修改后的 SVG 图标
    if (updated.svg && updated.name) {
      this.registerToAllEngines(updated.name, updated.svg);
    }

    // 更新本地缓存数组
    const index = this.icons.findIndex((i) =>
      updated.id ? i.id === updated.id : String(i.name).toLowerCase() === String(updated.name).toLowerCase(),
    );
    if (index >= 0) {
      this.icons[index] = { ...this.icons[index], ...updated };
    }

    if (updated.category && !this.categories.includes(updated.category)) {
      this.categories.push(updated.category);
    }

    this.saveToLocalStorage(this.icons);
    this.notify();
    return updated;
  }

  /**
   * 删除图标
   */
  public async deleteIcon(identifier: { id?: number | string; name?: string }, client?: any): Promise<boolean> {
    const api = client || this.apiClient;
    if (!api) throw new Error('API Client is not ready');

    try {
      await api.request({
        url: 'customIcons:destroy',
        method: 'post',
        params: { filterByTk: identifier.id, name: identifier.name },
      });
    } catch (e) {
      await api.request({
        url: 'custom_icons:destroy',
        method: 'post',
        params: { filterByTk: identifier.id, name: identifier.name },
      });
    }

    if (identifier.id) {
      this.icons = this.icons.filter((i) => i.id !== identifier.id);
    } else if (identifier.name) {
      const cleanTarget = String(identifier.name).toLowerCase();
      this.icons = this.icons.filter((i) => String(i.name).toLowerCase() !== cleanTarget);
    }

    this.saveToLocalStorage(this.icons);
    this.notify();
    return true;
  }

  public getRegisteredComponent(name: string): any {
    if (!name) return null;
    const str = String(name).trim();
    return this.registeredComponents.get(str) || this.registeredComponents.get(str.toLowerCase());
  }
}

export const customIconsManager = CustomIconsManager.getInstance();

export function safeHasIcon(name: string): boolean {
  if (!name) return false;
  const str = String(name).trim();
  const lower = str.toLowerCase();
  if (customIconsManager.getRegisteredComponent(str) || customIconsManager.getIcon(str)) {
    return true;
  }
  const map = getSafeIconsMap();
  if (map && typeof map.has === 'function') {
    if (map.has(str) || map.has(lower)) return true;
  }
  return antdIconsDict.has(lower) || antdIconsDict.has(str);
}

export const SafeIcon: React.FC<any> = (props) => {
  const { type, style, ...rest } = props || {};
  if (!type) return null;

  const strType = String(type).trim();
  const lowerType = strType.toLowerCase();

  // 1. 本地已注册的真实组件（支持自定义 SVG 及复合彩色图标）
  const RegisteredComp = customIconsManager.getRegisteredComponent(strType);
  if (RegisteredComp) {
    return React.createElement(RegisteredComp, { style, ...rest });
  }

  // 2. 宿主探测到的主应用 Icon 组件
  const HostIcon = customIconsManager.detectHostIcon();
  if (HostIcon && typeof HostIcon === 'function') {
    try {
      return React.createElement(HostIcon, { type: strType, style, ...rest });
    } catch (e) {}
  }

  // 3. 全局 icons Map 中注册的组件
  const map = getSafeIconsMap();
  const MapComp = map?.get?.(strType) || map?.get?.(lowerType);
  if (MapComp) {
    return React.createElement(MapComp, { style, ...rest });
  }

  // 4. Ant Design 内置图标字典
  const AntdComp = antdIconsDict.get(lowerType) || antdIconsDict.get(strType) || (AntdIcons as any)[strType];
  if (AntdComp) {
    return React.createElement(AntdComp, { style, ...rest });
  }

  // 5. 兜底样式
  return React.createElement('span', { className: 'anticon enhanced-safe-icon-fallback', style, ...rest });
};

