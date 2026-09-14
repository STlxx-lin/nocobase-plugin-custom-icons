# @nocobase/plugin-custom-icons

<p align="left">
  <b>English</b> | <a href="./README.md">简体中文</a>
</p>

[![Views](https://komarev.com/ghpvc/?username=nocobase-plugin-custom-icons&color=007ec6&style=flat-square&label=Views)](https://github.com/STlxx-lin/nocobase-plugin-custom-icons)
[![Version](https://img.shields.io/badge/version-v0.1.5-blue.svg)](https://github.com/STlxx-lin/nocobase-plugin-custom-icons/releases)
[![NocoBase Version](https://img.shields.io/badge/NocoBase-2.x-brightgreen.svg)](https://www.nocobase.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Custom Icon Libraries & Scalable SVG Extension Plugin for NocoBase**  
> A high-performance, enterprise-grade custom icon management suite built for NocoBase. It natively enhances the official `IconPicker` component with integrated color picking and font size controls, provides a built-in open-source icon repository market, and deeply integrates Alibaba Iconfont, Iconify, and Caomei Icon platforms. Effortlessly explore, sniff, and batch-import online collections to deliver a modern, customized visual experience for your NocoBase applications.

---

## 🌟 Key Features

- 🎨 **All-in-One Compact Controls**: Natively enhances icon input fields across menus, pages, and forms with real-time icon preview, identifier display, built-in color picker, font size stepper (`Default` / `sm` / `md` / `lg`), and one-click reset.
- 🖥️ **Modern Wide-Screen Selection Panel**: Adaptive popup width replaces narrow viewports. Features a fluid grid layout on the left and intelligent sub-category tags with live icon counts on the right for instant filtering and navigation.
- 🌐 **Open Icon Repository Market**: Direct navigation to premier design ecosystems (Iconfont, IconPark, Remix Icon, FontAwesome, etc.), featured repository cards with 10 representative preview icons, and one-click install/uninstall lifecycles.
- ⚡ **Alibaba Iconfont Online Sniffer**: Simply paste a public collection URL or collection ID (CID). The system automatically parses the title, author, and icon count, supports custom naming and category assignment, previews representative icons, and imports the entire set in seconds.
- 🌍 **Iconify 200,000+ Icon Ecosystem**: Enter any icon set prefix (e.g., `lucide`, `ri`, `tabler`, `simple-icons`, `streamline`, `carbon`, `heroicons`) to probe and install from 150+ popular open-source icon libraries.
- 📥 **Flexible & Diverse Import Modes**:
  - **Single SVG**: Automatic code sanitization, strip hardcoded dimensions, adapt to theme `currentColor`, with live previews across 16px, 24px, and 32px sizes.
  - **Multi-Source Batch Import**: Batch drag-and-drop local `.svg` files, parse Iconfont `<symbol>` bundles, or fetch online collections.
- 📋 **Lifecycle Icon Asset Management**: Professional table management view featuring icon preview, one-click identifier copy, in-place title editing, colored category badges, origin tracking, and safe deletion protections.
- 🔄 **Native Adaptive Rendering & Hot-Reload**: Newly imported libraries immediately appear in global icon dropdowns with zero restarts required, seamlessly adapting to `<Icon />`, navigation menus, buttons, and table columns.
- 📦 **Official Packaging Compliance**: Fully compatible with `yarn nocobase build --tar` and `yarn nocobase tar` commands for standard `.tgz` production deployment.

---

## 🌐 Supported Platforms for Connection & Import

The plugin provides an open connection architecture supporting direct imports and linking from world-leading icon platforms and design suites:

| Platform | Official Site | Supported Connection Formats & Rules | Included Libraries & Asset Scope | Import Mechanism & Advantages |
| :--- | :--- | :--- | :--- | :--- |
| **Alibaba Iconfont** | [iconfont.cn](https://www.iconfont.cn/) | • **Public Collection URL**:<br>`https://www.iconfont.cn/collections/detail?cid=xxxxx`<br>• **Project Management URL**:<br>`https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=xxxxx`<br>• **Collection Numeric ID**: e.g., `xxxxx`<br>• **Symbol Bundle Source**: Paste `<symbol id="...">` codes | Tens of millions of vector icons across industry collections, enterprise design systems, and curated libraries | **Automatic Online Sniffer**: Extracts collection title, author, and total icon count from URLs; allows custom display titles and categories; previews representative icons; imports whole sets in seconds. |
| **Iconify Ecosystem** | [iconify.design](https://iconify.design/) | • **Icon Set Prefix**: e.g., `lucide`, `ri`, `tabler`, `simple-icons`, `streamline`, `carbon`, `heroicons` | **150+** top open-source icon sets, **200,000+** vector icons:<br>• `lucide` (1,800+ modern crisp icons)<br>• `ri` (2,800+ Remix open-source icons)<br>• `tabler` (5,400+ high-definition stroke icons)<br>• `simple-icons` (3,100+ global brand & tech logos)<br>• `streamline` (3,900+ geometric stroke icons)<br>• `streamline-logos` (1,300+ brand logos)<br>• `material-symbols` / `carbon` / `heroicons` | **Dynamic API Sniffing & Hot-Install**: Probes metadata, licenses, authors, and sample icons online via prefix; installs with one click and hot-reloads categories into the picker. |
| **Caomei Icon** | [chuangzaoshi.com](https://chuangzaoshi.com/icon/) | • **Official ZIP Archive Link**:<br>`https://chuangzaoshi.com/icon/strawberry-v2.0.0.zip`<br>• Built-in high-fidelity offline assets | 380+ beautifully crafted icons covering development, office, multimedia, and UI interactions | **Dual Installation**: Download and unpack the latest official ZIP archive in real time, or install in milliseconds using built-in high-fidelity offline assets. |
| **Iconmonstr** | [iconmonstr.com](https://iconmonstr.com/) | • **Online Platform Ingestion**: `https://iconmonstr.com/`<br>• Real-time crawler controller for pages 1–80 | Monochromatic vector icons by German designer Alexander Kahlkopf (60 core icons built-in, full collection crawlable) | **Dual Mode**: Quick install of 60 core high-frequency vector icons, or targeted multi-page crawling via advanced crawler modal. |
| **Design Tools & Code Export** (Figma / Sketch / IconPark / Illustrator) | [IconPark](https://iconpark.oceanengine.com/) / Figma | • **Local Multi-File Drag & Drop**: Multiple `.svg` files<br>• **Multiple SVG Code Pasting**: Concatenated `<svg>` tags<br>• **Symbol Bundle Source**: `<svg><symbol>...</symbol></svg>` | Suitable for custom enterprise icon suites, Figma/Sketch exports, and ByteDance IconPark bundles | **Multi-Source Batch Parser**: Automatically identifies file names as icon keys and titles; cleans hardcoded dimensions and applies theme-aware `currentColor`. |

---

## 🖼️ Visual Walkthrough & Features

### 1. Native Enhancement: All-in-One Icon Controls

When configuring menus, page blocks, action buttons, or table columns, the plugin embeds a modern, integrated control set directly into input fields:

![All-in-One Icon Controls](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-08-21.png)

- **Visual Icon & Identifier Display**: Displays the current icon glyph and its unique identifier.
- **Built-in Color Picker**: Click the color palette button to select custom foreground colors.
- **Font Size Stepper**: Quick-select between `Default`, `Small (sm)`, `Medium (md)`, and `Large (lg)` without touching custom CSS.
- **Instant Reset**: One-click clear button restores the field quickly.

---

### 2. Modern Layout: Wide-Screen Selection Panel & Sub-Categories

Clicking the icon input opens an expansive, responsive selection popup designed for high-density browsing and rapid filtering:

![Wide-Screen Selection Panel](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-08-42.png)

- **Instant Search Bar**: Real-time filtering by English identifier, Chinese title, or pinyin.
- **Adaptive Wide-Screen View**: Dynamically scales with your viewport width (wide-screen default), ensuring spacious visualization.
- **Intelligent Sub-Category Tags**: Automatically clusters icons into functional sub-categories (e.g., General, Directional, Media, Documents) with live item counts for one-click filtering.
- **Quick Import Shortcut**: A prominent `+ Import` button is pinned at the top-right for on-the-fly additions.

---

### 3. Multi-Dimensional Taxonomy: Built-in & External Libraries

The category dropdown neatly segregates native styles from custom and third-party libraries:

![Category Dropdown Menu](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-08-55.png)

- **Native System Styles**: Outlined, Filled, and Two-Tone styles from Ant Design.
- **Extended & External Libraries**: Dynamically appended custom libraries, Caomei, Iconmonstr, and imported online collections.

---

### 4. Single SVG Custom Import & Code Sanitization

Quickly add bespoke icons or corporate brand logos via the import modal:

![Single SVG Custom Import](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-09-17.png)

- **Automated Sanitization**: Strips hardcoded `width`, `height`, and inline fill colors, converting them to `1em` and `currentColor` for flawless theme synchronization.
- **Metadata Customization**: Set unique alphanumeric identifiers, human-readable titles, and target categories.
- **Multi-Size Live Preview**: Inspect rendering fidelity across 16px, 24px, and 32px with real-time color feedback.

---

### 5. Multi-Source Batch Import & Local Drag-and-Drop

For bulk onboarding, the **Batch Import / External Libraries** tab accommodates multiple ingestion channels:

![Batch Import & External Libraries](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-09-26.png)

- **Drag-and-Drop Multiple SVGs**: Drag files directly into the dropzone for instant multi-file parsing and naming.
- **One-Click Iconfont Fetch**: Paste Alibaba Iconfont collection links for automated background extraction.
- **Symbol & SVG Code Parsing**: Paste multi-symbol or multi-SVG markup directly to extract icons in bulk.

---

### 6. Icon Repository Market & Visual Previews

Located in system settings (**Plugin Manager -> Custom Icons Settings -> Icon Repository Market**), this hub aggregates leading global icon ecosystems:

![Icon Repository Market](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-09-41.png)

- **Ecosystem Portals**: Quick-launch links to Iconfont, ByteDance IconPark, Remix Icon, and FontAwesome.
- **Card-Based Previews**: Each repository card presents **10 representative preview icons** for immediate visual evaluation.
- **Category Filter Tabs**: Filter by All, Featured, Monochrome, Brand Logos, and more.

---

### 7. Deep Integration: Alibaba Iconfont Online Sniffer & Ingestion

Seamlessly connect to Alibaba Iconfont (iconfont.cn) to import entire public collections in two simple steps:

#### Step 1: Copy the Public Collection URL
Open any public icon collection in your browser and copy the address bar URL (e.g., `https://www.iconfont.cn/collections/detail?cid=...`):

![Iconfont URL Extraction](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-10-34.png)

#### Step 2: Paste URL & Sniff Details
Paste the URL into the search field at the top of the repository market and click **Sniff Online**:

![Online Sniffing & Ingestion](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-10-55.png)

- **Metadata Extraction**: Automatically extracts collection title, icon count, and author.
- **Configuration Customization**: Customize display titles and target category names.
- **Live Representative Previews**: Inspect icons before confirming, then click **Import Now** for instant database persistence.

---

### 8. Lifecycle Management & Safe Uninstallation

Once installed, repository cards reflect their active state and offer complete lifecycle controls:

![Installed Repository Card](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-11-14.png)

- **"Installed" Status Badge**: Displays total imported count and 10 representative glyphs.
- **Edit Configuration**: Modify display title, category, or notes at any time.
- **Visit Homepage**: Direct link back to the upstream source project.
- **Safe Cascade Uninstall**: Cleanly uninstalls the library and purges associated icon records without affecting other libraries.

---

### 9. Asset Center: Installed Icons Table Management

Manage all imported icon assets under the **Installed Icons** tab:

![Installed Icons Table Management](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-11-29.png)

- **High-Definition Previews**: Large, clear icon rendering for quick visual inspection.
- **One-Click Identifier Copy**: Copy exact icon keys for use in formulas or custom frontend code.
- **Badges & Source Tracking**: Differentiates categories with color tags and tracks asset origin.
- **Search & Maintenance**: Fast keyword search, category filtering, and single-item edit/delete actions.

---

### 10. Production Use: Hot-Reload & Real-World Application

Newly installed icon sets take effect across the entire system immediately without restarting services:

| Category Dropdown Hot-Reload | Real-World Application (Menu Configuration) |
| :---: | :---: |
| ![Hot-Reload Category](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-11-47.png) | ![Menu Configuration](https://raw.githubusercontent.com/STlxx-lin/plugin-custom-icons/main/.github/png/PixPin_2026-09-10_17-11-57.png) |

- **Instant Recognition**: New categories (e.g., "Hippo Design Official Icons") appear immediately in the selector.
- **Sub-Category Clustering**: Select from responsive grids clustered by sub-category (e.g., "Office & Documents (180)") for instant, pixel-perfect rendering across menus, tabs, and buttons.

---

## 🚀 Installation & Deployment

### Method 1: Build & Enable in Source Code
Run from your NocoBase project root:

```bash
# Build plugin
yarn nocobase build @nocobase/plugin-custom-icons

# Enable plugin
yarn pm enable @nocobase/plugin-custom-icons
```

### Method 2: Import Official Package (.tgz)
For production or offline environments, import directly using the NocoBase CLI or Plugin Manager:

```bash
# Import the official plugin package
yarn nocobase plugin import storage/tar/@nocobase/plugin-custom-icons-0.1.4.tgz

# Enable plugin
yarn pm enable @nocobase/plugin-custom-icons
```

*Note: You can also extract the archive directly to `./storage/plugins/@nocobase/plugin-custom-icons`.*

---

## 📦 Official Packaging & Build

This plugin strictly adheres to the [NocoBase Official Plugin Build Specification](https://docs.nocobase.com/cn/plugin-development/build).

Execute the following commands in the workspace root to produce the official package:

```bash
# Option A: One-step build and package into .tgz
yarn nocobase build @nocobase/plugin-custom-icons --tar

# Option B: Package an already built plugin into .tgz
yarn nocobase tar @nocobase/plugin-custom-icons
```

Upon completion, the distribution archive is output to:  
📁 `storage/tar/@nocobase/plugin-custom-icons-0.1.4.tgz`

---

## ⚙️ Architecture & Technical Highlights

1. **Dual Persistence Mechanism**: All custom icons and repository definitions are stored simultaneously in the NocoBase core database and local asset storage, ensuring durability through system upgrades, migrations, and container restarts.
2. **Security & Sanitization**: SVG sources undergo rigorous XSS sanitization, stripping scripts and malicious event handlers to safeguard enterprise runtimes.
3. **Chunked Database Processing**: Tuned for SQLite, MySQL, and PostgreSQL. Batch imports and deletions automatically divide operations into chunks, completely eliminating SQL expression depth errors.
4. **Optimized Rendering Performance**: The icon picker utilizes virtualized fluid grids and on-demand loading, delivering silky-smooth 60fps scrolling even when browsing libraries with thousands of icons.

---

## 📄 License

This project is licensed under the [AGPL-3.0 License](LICENSE).
