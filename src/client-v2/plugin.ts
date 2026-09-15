import React from 'react';
import { Plugin } from '@nocobase/client-v2';
import { customIconsManager } from './services/custom-icons-manager';
import { EnhancedIconPicker } from './components/EnhancedIconPicker';
import { CustomIconsSettingsPage } from './pages/CustomIconsSettingsPage';

export class PluginCustomIconsClientV2 extends Plugin {
  async load() {
    // 1. 设置主应用实例与 API Client 并启动多阶段宿主图标探测与保活
    customIconsManager.setApp(this.app);
    customIconsManager.setApiClient(this.app.apiClient);
    customIconsManager.scheduleHostIconDetection();
    await customIconsManager.loadIcons(this.app.apiClient);

    // 辅助函数：深度扫描并预热数据中的复合图标，第一时间注入宿主
    const scanAndRegisterIcons = (data: any) => {
      if (!data) return;
      let registeredAny = false;
      const walk = (node: any) => {
        if (!node) return;
        if (typeof node === 'string') {
          if (node.includes('?')) {
            customIconsManager.registerStyledIcon(node);
            registeredAny = true;
          }
          return;
        }
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node === 'object') {
          if (typeof node.icon === 'string' && node.icon.includes('?')) {
            customIconsManager.registerStyledIcon(node.icon);
            registeredAny = true;
          }
          ['routes', 'children', 'data', 'items', 'subModels', 'options'].forEach((k) => {
            if (node[k]) walk(node[k]);
          });
        }
      };
      walk(data);
      if (registeredAny) {
        customIconsManager.flushToHostIcon();
        setTimeout(() => {
          customIconsManager.compensateDomIcons();
        }, 30);
      }
    };

    // 挂载 APIClient 响应拦截器，一旦拉取到包含复合图标的路由/配置，第一时间自动解析预热并注入宿主
    if (this.app.apiClient?.axios?.interceptors?.response) {
      try {
        this.app.apiClient.axios.interceptors.response.use((response: any) => {
          try {
            if (response?.data) {
              scanAndRegisterIcons(response.data);
            }
          } catch (e) {}
          return response;
        });
      } catch (e) {}
    }

    // 监听登录态变更与应用就绪事件，确保任何时候登录或路由切换后立刻同步与巡检
    if (this.app.eventBus) {
      try {
        this.app.eventBus.addEventListener?.('auth:signIn', () => {
          customIconsManager.loadIcons(this.app.apiClient);
        });
        this.app.eventBus.addEventListener?.('app:ready', () => {
          customIconsManager.detectHostIcon();
          customIconsManager.compensateDomIcons();
        });
      } catch (e) {}
    }

    // 针对客户端路由变化与窗口事件，持续执行巡检补偿
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        setTimeout(() => customIconsManager.compensateDomIcons(), 50);
      });
      window.addEventListener('load', () => {
        customIconsManager.detectHostIcon();
        customIconsManager.compensateDomIcons();
      });
    }

    // 2. 包装并向全局注册增强型 IconPicker
    const BoundEnhancedIconPicker: React.FC<any> = (props) => {
      return React.createElement(EnhancedIconPicker, {
        ...props,
        apiClient: this.app.apiClient,
      });
    };

    // 注册到应用级 SchemaComponent
    this.app.addComponents({ IconPicker: BoundEnhancedIconPicker });

    // 覆盖 FlowEngine flowSettings 中的组件字典（用于菜单管理、PageTabModel、ActionModel 等）
    if (this.app.flowEngine?.flowSettings) {
      this.app.flowEngine.flowSettings.registerComponents({
        IconPicker: BoundEnhancedIconPicker,
      });
    }

    // 3. 在系统设置中挂载“自定义图标库”管理入口
    const manager = this.app.pluginSettingsManager as any;
    if (manager) {
      let title = '自定义图标库';
      try {
        const i18n = this.app?.i18n;
        const res = i18n?.t ? i18n.t('Custom Icons', { ns: ['@nocobase/plugin-custom-icons', 'client'] }) : null;
        if (res && res !== 'Custom Icons') {
          title = res;
        } else {
          const lang = (i18n?.language || (typeof window !== 'undefined' ? localStorage.getItem('NOCOBASE_LOCALE') : '') || '').toLowerCase();
          title = (!lang || lang.startsWith('zh')) ? '自定义图标库' : (res || 'Custom Icons');
        }
      } catch (e) {
        title = '自定义图标库';
      }
      const icon = 'AppstoreAddOutlined';
      const menuKey = 'custom-icons';
      const pageName = `${menuKey}.index`;

      const PageWrapper: React.FC = () => {
        return React.createElement(CustomIconsSettingsPage, { api: this.app.apiClient });
      };

      if (typeof manager.addMenuItem === 'function' && typeof manager.addPageTabItem === 'function') {
        manager.addMenuItem({
          key: menuKey,
          title,
          icon,
          aclSnippet: 'pm',
        });

        manager.addPageTabItem({
          menuKey,
          key: 'index',
          title,
          icon,
          aclSnippet: 'pm',
          Component: PageWrapper,
        });

        const pluginNames = [
          this.options?.name,
          this.options?.packageName,
          'custom-icons',
          '@nocobase/plugin-custom-icons',
        ].filter(Boolean);

        [...new Set(pluginNames)].forEach((pName) => {
          manager.setPluginSettingsLink?.(pName, pageName);
        });
      } else if (typeof manager.add === 'function') {
        manager.add(menuKey, {
          title,
          icon,
          aclSnippet: 'pm',
          Component: PageWrapper,
        });
      }
    }
  }
}

export default PluginCustomIconsClientV2;
