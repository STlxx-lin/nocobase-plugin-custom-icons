import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Popconfirm,
  message,
  Tooltip,
  Alert,
  Input,
  Radio,
  Spin,
  Divider,
  Empty,
  Modal,
  Progress,
  InputNumber,
  theme,
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  CloudDownloadOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  CompassOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ForwardOutlined,
  EditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { customIconsManager } from '../services/custom-icons-manager';
import { sanitizeAndFormatSvg } from '../utils/svg-helper';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// 创造狮草莓图标的本地真实高保真矢量预览映射
const REAL_CAOMEI_PREVIEWS: Record<string, string> = {
  'czs-home': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M128 512v448h288v-256h192v256h288v-448l-384-320z" fill="currentColor" /><path d="M512 57.6l-448 371.2v83.2l448-371.2 448 371.2v-83.2z" fill="currentColor" /></svg>',
  'czs-setting': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M1011.2 422.4c-19.2 6.4-32 6.4-51.2 6.4-51.2 0-102.4-25.6-134.4-76.8-38.4-64-19.2-147.2 32-192-51.2-51.2-121.6-89.6-192-115.2-12.8 70.4-76.8 128-153.6 128-70.4 0-134.4-57.6-147.2-128-70.4 19.2-140.8 57.6-198.4 108.8 64 44.8 83.2 134.4 38.4 198.4-25.6 51.2-76.8 76.8-128 76.8-19.2 0-44.8-6.4-64-12.8-6.4 38.4-12.8 76.8-12.8 115.2s6.4 76.8 12.8 115.2c19.2-6.4 44.8-12.8 64-12.8 51.2 0 102.4 25.6 134.4 76.8 38.4 70.4 19.2 153.6-38.4 198.4 51.2 51.2 121.6 96 192 115.2 12.8-76.8 76.8-134.4 153.6-134.4s140.8 57.6 153.6 128c70.4-25.6 140.8-64 192-115.2-57.6-44.8-70.4-128-32-192 25.6-51.2 83.2-76.8 134.4-76.8 19.2 0 32 0 51.2 6.4 0-32 6.4-70.4 6.4-108.8s-6.4-76.8-12.8-108.8zM640 537.6c0 70.4-57.6 128-128 128s-128-57.6-128-128c0-70.4 57.6-128 128-128s128 57.6 128 128z" fill="currentColor" /></svg>',
  'czs-user': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M768 320c0 141.385-114.615 256-256 256s-256-114.615-256-256c0-141.385 114.615-256 256-256s256 114.615 256 256z" fill="currentColor" /><path d="M512 576c-224 0-409.6 166.4-441.6 384h883.2c-32-217.6-217.6-384-441.6-384z" fill="currentColor" /></svg>',
  'czs-heart': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M928 185.6c-44.8-51.2-108.8-76.8-179.2-76.8-64 0-128 25.6-179.2 76.8l-57.6 57.6-57.6-64c-51.2-44.8-115.2-70.4-179.2-70.4s-128 25.6-179.2 76.8c-96 96-96 262.4 0 358.4l416 416 416-416c96-96 96-262.4 0-358.4z" fill="currentColor" /></svg>',
  'czs-star': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 0l160 320 352 51.2-256 249.6 57.6 352-313.6-166.4-313.6 166.4 57.6-352-256-249.6 352-51.2z" fill="currentColor" /></svg>',
  'czs-shield': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M755.2 83.2c-153.6-51.2-326.4-51.2-480 0l-147.2 44.8v512l384 384 384-384v-512l-140.8-44.8zM832 620.8l-320 320-320-320v-422.4l121.6-38.4c64-19.2 134.4-32 198.4-32s134.4 12.8 198.4 32l121.6 38.4v422.4z" fill="currentColor" /><path d="M512 185.6c-64 0-121.6 12.8-179.2 32l-76.8 25.6v352l256 256 256-256v-352l-76.8-25.6c-57.6-19.2-115.2-32-179.2-32zM460.8 576l-140.8-140.8 44.8-44.8 96 96 224-230.4 44.8 44.8-268.8 275.2z" fill="currentColor" /></svg>',
  'czs-camera': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M384 192v-64h-256v64h-64v704h896v-704h-576zM416 768c-121.6 0-224-102.4-224-224s102.4-224 224-224 224 102.4 224 224-102.4 224-224 224zM832 384h-192v-64h192v64z" fill="currentColor" /><path d="M416 384c-89.6 0-160 70.4-160 160s70.4 160 160 160 160-70.4 160-160c0-89.6-70.4-160-160-160zM416 640c-51.2 0-96-44.8-96-96s44.8-96 96-96c51.2 0 96 44.8 96 96s-44.8 96-96 96z" fill="currentColor" /></svg>',
  'czs-cloud': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M800 377.6c6.4-166.4-128-294.4-288-294.4s-294.4 128-294.4 294.4c-121.6 0-217.6 96-217.6 217.6s96 217.6 217.6 217.6h582.4c121.6 0 217.6-96 217.6-217.6s-96-217.6-217.6-217.6z" fill="currentColor" /></svg>',
  'czs-airplane': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M864 384h-275.2l-204.8-256h-64l51.2 256h-179.2l-128-128v448l128-128h192l-64 256h64l256-256h224c51.2 0 96-44.8 96-96s-44.8-96-96-96z" fill="currentColor" /></svg>',
  'czs-folder': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 256l-128-128h-320v768h896v-640z" fill="currentColor" /></svg>',
  'czs-about': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64c-249.6 0-448 198.4-448 448s198.4 448 448 448 448-198.4 448-448c0-249.6-198.4-448-448-448zM544 768h-64v-64h64v64zM544 640h-64v-384h64v384z" fill="currentColor" /></svg>',
  'czs-alipay': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M1024 704v-505.6c0-108.8-89.6-198.4-198.4-198.4h-627.2c-108.8 0-198.4 89.6-198.4 198.4v627.2c0 108.8 89.6 198.4 198.4 198.4h627.2c96 0 179.2-70.4 192-160-51.2-25.6-281.6-121.6-396.8-179.2-89.6 108.8-185.6 172.8-326.4 172.8s-236.8-89.6-224-192c12.8-70.4 57.6-185.6 268.8-166.4 108.8 12.8 160 32 249.6 64 25.6-44.8 44.8-89.6 57.6-140.8h-396.8v-38.4h198.4v-70.4h-243.2v-44.8h243.2v-102.4c0 0 0-19.2 19.2-19.2h96v115.2h256v44.8h-256v76.8h211.2c-19.2 76.8-51.2 147.2-83.2 211.2 57.6 19.2 332.8 108.8 332.8 108.8zM281.6 793.6c-147.2 0-172.8-96-166.4-134.4 12.8-38.4 51.2-89.6 134.4-89.6 96 0 179.2 25.6 281.6 76.8-64 89.6-153.6 147.2-249.6 147.2z" fill="currentColor" /></svg>',
  'czs-android': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M217.6 345.6h563.2v409.6c0 38.4-32 70.4-64 70.4h-44.8v134.4c0 32-25.6 64-64 64-32 0-64-25.6-64-64v-140.8h-89.6v140.8c0 32-25.6 64-64 64-32 0-64-25.6-64-64v-140.8h-44.8c-38.4 0-70.4-32-70.4-70.4l6.4-403.2zM128 332.8c-32 0-64 25.6-64 64v262.4c0 32 25.6 64 64 64s64-25.6 64-64v-262.4c0-38.4-32-64-64-64zM780.8 320h-569.6c0-96 57.6-185.6 147.2-224l-44.8-83.2c0-6.4 0-12.8 0-12.8 6.4 0 12.8 0 12.8 6.4l44.8 83.2c38.4-19.2 76.8-25.6 121.6-25.6s83.2 6.4 121.6 25.6l44.8-83.2c6.4-6.4 12.8-6.4 19.2-6.4s6.4 6.4 0 12.8l-38.4 83.2c83.2 44.8 140.8 128 140.8 224zM390.4 192c0-12.8-12.8-25.6-25.6-25.6-12.8 6.4-19.2 12.8-19.2 25.6s12.8 25.6 25.6 25.6c12.8 0 19.2-12.8 19.2-25.6zM652.8 192c0-12.8-12.8-25.6-25.6-25.6-12.8 6.4-25.6 12.8-25.6 25.6s12.8 25.6 25.6 25.6c12.8 0 25.6-12.8 25.6-25.6zM870.4 332.8c-32 0-64 25.6-64 64v262.4c0 32 25.6 64 64 64 32 0 64-25.6 64-64v-262.4c-6.4-38.4-32-64-64-64z" fill="currentColor" /></svg>',
  'czs-apple': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M844.8 672c-25.6-38.4-44.8-89.6-44.8-134.4s12.8-89.6 38.4-128c12.8-19.2 38.4-44.8 70.4-70.4-19.2-25.6-44.8-44.8-64-64-38.4-25.6-83.2-38.4-128-38.4-32 0-64 6.4-108.8 19.2-38.4 12.8-64 19.2-83.2 19.2-12.8 0-44.8-6.4-83.2-19.2-44.8-12.8-83.2-19.2-108.8-19.2-70.4 0-128 32-172.8 89.6-51.2 57.6-76.8 134.4-76.8 230.4 0 102.4 32 204.8 89.6 307.2 64 108.8 121.6 160 185.6 160 19.2 0 44.8-6.4 83.2-19.2 32-12.8 64-19.2 89.6-19.2s57.6 6.4 96 19.2c38.4 12.8 64 19.2 83.2 19.2 51.2 0 102.4-38.4 160-121.6 38.4-51.2 57.6-102.4 76.8-153.6-38.4-12.8-70.4-38.4-102.4-76.8z" fill="currentColor" /><path d="M633.6 192c25.6-25.6 44.8-51.2 57.6-83.2s19.2-57.6 19.2-83.2c0-6.4 0-6.4 0-12.8s0-6.4 0-12.8c-76.8 19.2-128 44.8-153.6 89.6-32 44.8-51.2 96-51.2 160 32 0 51.2-6.4 64-12.8 19.2-6.4 44.8-19.2 64-44.8z" fill="currentColor" /></svg>',
  'czs-chrome': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M256 448l-147.2-256c96-115.2 243.2-192 403.2-192 185.6 0 352 102.4 441.6 249.6h-416c-6.4 0-12.8 0-25.6 0-121.6 0-224 83.2-256 198.4v0zM697.6 326.4h294.4c19.2 57.6 32 121.6 32 185.6 0 281.6-224 512-505.6 512l211.2-364.8c32-44.8 44.8-96 44.8-147.2 0-70.4-32-140.8-76.8-185.6v0zM326.4 512c0-102.4 83.2-185.6 185.6-185.6s185.6 83.2 185.6 185.6-83.2 185.6-185.6 185.6-185.6-83.2-185.6-185.6zM582.4 761.6l-147.2 256c-243.2-38.4-435.2-249.6-435.2-505.6 0-89.6 25.6-179.2 64-249.6l211.2 364.8c44.8 89.6 134.4 153.6 236.8 153.6 25.6-6.4 44.8-12.8 70.4-19.2z" fill="currentColor" /></svg>',
  'czs-code-branch': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M832 320c0-70.4-57.6-128-128-128s-128 57.6-128 128c0 44.8 25.6 83.2 57.6 108.8-19.2 57.6-64 108.8-134.4 121.6-44.8 0-83.2 19.2-115.2 38.4v-288c38.4-19.2 64-64 64-108.8 0-70.4-57.6-128-128-128s-128 57.6-128 128c0 44.8 25.6 89.6 64 108.8v422.4c-38.4 19.2-64 64-64 108.8 0 70.4 57.6 128 128 128s128-57.6 128-128c0-32-12.8-64-38.4-89.6 25.6-38.4 64-64 115.2-70.4 121.6-19.2 217.6-115.2 236.8-236.8 44.8-25.6 70.4-64 70.4-115.2zM320 128c38.4 0 64 25.6 64 64s-25.6 64-64 64-64-25.6-64-64 25.6-64 64-64zM320 896c-38.4 0-64-25.6-64-64s25.6-64 64-64 64 25.6 64 64-25.6 64-64 64zM704 384c-38.4 0-64-25.6-64-64s25.6-64 64-64 64 25.6 64 64-25.6 64-64 64z" fill="currentColor" /></svg>',
  'czs-cup': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M0 832h832v64h-832v-64z" fill="currentColor" /><path d="M864 256h-96v-64h-704v512c0 38.4 25.6 64 64 64h576c38.4 0 64-25.6 64-64v-128h96c89.6 0 160-70.4 160-160s-70.4-160-160-160zM192 576h-64v-320h64v320zM864 512h-96v-192h96c51.2 0 96 44.8 96 96s-44.8 96-96 96z" fill="currentColor" /></svg>',
  'czs-dashboard': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 128c-249.6 0-448 198.4-448 448 0 70.4 12.8 134.4 44.8 192h806.4c25.6-57.6 44.8-121.6 44.8-192 0-249.6-198.4-448-448-448zM768 608v-64h64v64h-64zM716.8 416l-44.8-44.8 44.8-44.8 44.8 44.8-44.8 44.8zM256 544v64h-64v-64h64zM307.2 416l-44.8-44.8 44.8-44.8 44.8 44.8-44.8 44.8zM480 320v-64h64v64h-64zM448 704l64-320 64 320h-128z" fill="currentColor" /></svg>',
  'czs-github': '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M915.2 326.4c6.4-19.2 32-96-6.4-198.4 0 0-64-19.2-204.8 76.8-64-12.8-128-19.2-192-19.2s-128 6.4-185.6 19.2c-147.2-96-211.2-76.8-211.2-76.8-38.4 102.4-12.8 179.2-6.4 198.4-44.8 51.2-76.8 121.6-76.8 204.8 0 307.2 198.4 377.6 480 377.6s480-70.4 480-377.6c0-83.2-32-153.6-76.8-204.8zM512 851.2c-198.4 0-358.4-6.4-358.4-198.4 0-44.8 25.6-89.6 64-121.6 64-57.6 172.8-25.6 300.8-25.6 121.6 0 230.4-32 294.4 25.6 38.4 38.4 64 76.8 64 121.6-6.4 185.6-166.4 198.4-364.8 198.4zM358.4 550.4c-38.4 0-70.4 51.2-70.4 108.8s32 108.8 70.4 108.8 70.4-51.2 70.4-108.8-25.6-108.8-70.4-108.8zM665.6 550.4c-38.4 0-70.4 44.8-70.4 108.8s32 108.8 70.4 108.8c38.4 0 70.4-51.2 70.4-108.8s-32-108.8-70.4-108.8z" fill="currentColor" /></svg>',
};

// Iconmonstr 官方经典黑白矢量预览映射
const REAL_ICONMONSTR_PREVIEWS: Record<string, string> = {
  'quote-right-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m2.699 20c-.411 0-.699-.312-.699-.662 0-.249.145-.516.497-.703 1.788-.947 3.858-4.226 3.858-6.248-3.016.092-4.326-2.582-4.326-4.258 0-2.006 1.738-4.129 4.308-4.129 3.241 0 4.83 2.547 4.83 5.307 0 5.981-6.834 10.693-8.468 10.693zm10.833 0c-.41 0-.699-.312-.699-.662 0-.249.145-.516.497-.703 1.788-.947 3.858-4.226 3.858-6.248-3.015.092-4.326-2.582-4.326-4.258 0-2.006 1.739-4.129 4.308-4.129 3.241 0 4.83 2.547 4.83 5.307 0 5.981-6.833 10.693-8.468 10.693z" fill-rule="nonzero"/></svg>',
  'quote-left-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m21.301 4c.411 0 .699.313.699.663 0 .248-.145.515-.497.702-1.788.948-3.858 4.226-3.858 6.248 3.016-.092 4.326 2.582 4.326 4.258 0 2.007-1.738 4.129-4.308 4.129-3.24 0-4.83-2.547-4.83-5.307 0-5.98 6.834-10.693 8.468-10.693zm-10.833 0c.41 0 .699.313.699.663 0 .248-.145.515-.497.702-1.788.948-3.858 4.226-3.858 6.248 3.016-.092 4.326 2.582 4.326 4.258 0 2.007-1.739 4.129-4.308 4.129-3.241 0-4.83-2.547-4.83-5.307 0-5.98 6.833-10.693 8.468-10.693z" fill-rule="nonzero"/></svg>',
  'layer-multiple-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22 8c0-.478-.379-1-1-1h-13c-.62 0-1 .519-1 1v13c0 .621.52 1 1 1h13c.478 0 1-.379 1-1zm-16-2h13.25c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-13.75c-.53 0-1 .47-1 1v13.75c0 .414.336.75.75.75s.75-.336.75-.75zm-2.5-2.5h13.75c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-14.25c-.53 0-1 .47-1 1v14.25c0 .414.336.75.75.75s.75-.336.75-.75z" fill-rule="nonzero"/></svg>',
  'copy-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m16.5 11.5v11.5h-15.5v-15.5h11.5zm-1 1h-13.5v13.5h13.5zm7.5-11.5v14.5h-1v-13.5h-13.5v-1z" fill-rule="nonzero"/></svg>',
  'pencil-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m19.5 0c1.378 0 2.5 1.122 2.5 2.5 0 .666-.264 1.305-.732 1.774l-14.768 14.726h-4.5v-4.5l14.726-14.768c.469-.468 1.108-.732 1.774-.732zm-12.793 18.001 13.526-13.526c.211-.211.33-.497.33-.794 0-.62-.505-1.125-1.125-1.125-.297 0-.583.119-.794.33l-13.526 13.526zm-3.707.999v1h1l10.999-10.999-1-1z" fill-rule="nonzero"/></svg>',
  'heart-filled': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m12 5.72c-2.624-4.517-10-3.198-10 2.461 0 3.725 4.345 7.727 9.303 12.54.194.189.446.283.697.283s.503-.094.697-.283c4.977-4.831 9.303-8.814 9.303-12.54 0-5.678-7.396-6.944-10-2.461z" fill-rule="nonzero"/></svg>',
  'save-lined': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23 4.5v18.5h-22v-22h14.5zm-21 17.5h20v-16.897l-3.603-3.603h-16.397zm3-15h14v2h-14zm0 4h14v2h-14zm0 4h14v2h-14z" fill-rule="nonzero"/></svg>',
  'magnifier-lined': '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m15.97 17.031c-1.479 1.238-3.384 1.985-5.461 1.985-4.697 0-8.509-3.812-8.509-8.508s3.812-8.508 8.509-8.508 8.508 3.812 8.508 8.508c0 2.078-.747 3.984-1.985 5.461l4.977 4.977c.293.293.293.767 0 1.06-.293.293-.768.293-1.061 0zm-5.461-13.539c-3.867 0-7.008 3.141-7.008 7.008s3.141 7.008 7.008 7.008 7.008-3.141 7.008-7.008-3.141-7.008-7.008-7.008z" fill-rule="nonzero"/></svg>',
};

export interface IconRepoItem {
  key: string;
  title: string;
  category: string;
  version: string;
  homepage: string;
  description: string;
  downloadUrl?: string;
  sourceType: 'zip' | 'iconify' | 'iconmonstr' | 'iconfont';
  prefix?: string;
  iconCount: number;
  tags?: string[];
  status: 'installed' | 'not_installed' | 'installing';
  installedCount?: number;
  installedAt?: string;
  previewIcons: string[];
}

interface ProbeResult {
  prefix: string;
  title: string;
  total: number;
  author: string;
  license: string;
  category: string;
  samples: string[];
  homepage: string;
  sourcePlatform?: string;
  rawIconfontData?: any;
}

interface IconRepoMarketProps {
  apiClient: any;
  onRepoChanged?: () => void;
}

export const IconRepoMarket: React.FC<IconRepoMarketProps> = ({ apiClient, onRepoChanged }) => {
  const { token } = theme.useToken();
  const isDark = useMemo(() => {
    if (token.colorBgContainer === '#141414' || token.colorBgBase === '#000' || token.colorBgBase === '#000000') return true;
    const bg = token.colorBgContainer || '#ffffff';
    if (bg.startsWith('#') && (bg.length === 7 || bg.length === 4)) {
      const hex = bg.length === 4
        ? bg.slice(1).split('').map((c) => c + c).join('')
        : bg.slice(1);
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq < 128;
    }
    return false;
  }, [token.colorBgContainer, token.colorBgBase]);

  const [repos, setRepos] = useState<IconRepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [operatingKey, setOperatingKey] = useState<string | null>(null);

  // 搜索与标签筛选
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Iconify 自定义输入探测
  const [customInput, setCustomInput] = useState<string>('');
  const [probing, setProbing] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [probeCustomTitle, setProbeCustomTitle] = useState<string>('');
  const [probeCustomCategory, setProbeCustomCategory] = useState<string>('');
  const [probeCustomDescription, setProbeCustomDescription] = useState<string>('');

  // Iconfont 平台合辑导入状态
  const [iconfontModalVisible, setIconfontModalVisible] = useState<boolean>(false);
  const [iconfontInput, setIconfontInput] = useState<string>('');
  const [iconfontProbing, setIconfontProbing] = useState<boolean>(false);
  const [iconfontProbeData, setIconfontProbeData] = useState<any>(null);
  const [iconfontCustomTitle, setIconfontCustomTitle] = useState<string>('');
  const [iconfontCustomCategory, setIconfontCustomCategory] = useState<string>('');
  const [iconfontCustomDescription, setIconfontCustomDescription] = useState<string>('');
  const [iconfontImporting, setIconfontImporting] = useState<boolean>(false);

  // 仓库配置修改状态（针对所有已安装的仓库）
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingRepo, setEditingRepo] = useState<IconRepoItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editHomepage, setEditHomepage] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Iconmonstr 分页面全量实时拉取控制状态
  const [crawlModalVisible, setCrawlModalVisible] = useState<boolean>(false);
  const [crawlStartPage, setCrawlStartPage] = useState<number>(1);
  const [crawlEndPage, setCrawlEndPage] = useState<number>(80);
  const [crawlRunning, setCrawlRunning] = useState<boolean>(false);
  const [crawlCurrentPage, setCrawlCurrentPage] = useState<number>(1);
  const [crawlTotalInstalled, setCrawlTotalInstalled] = useState<number>(0);
  const [crawlLogText, setCrawlLogText] = useState<string>('');
  const stopCrawlRef = React.useRef<boolean>(false);

  // 本地已加载的全部图标池（用于直接显示已安装合辑的前 5 个真实图标）
  const [localIcons, setLocalIcons] = useState<any[]>(customIconsManager.getAllIcons());

  const fetchRepos = async () => {
    if (!apiClient) return;
    setLoading(true);
    try {
      const [, res] = await Promise.all([
        customIconsManager
          .loadIcons(apiClient)
          .then(() => setLocalIcons(customIconsManager.getAllIcons()))
          .catch(() => {}),
        (async () => {
          try {
            return await apiClient.request({ url: 'customIconRepos:list' });
          } catch (e) {
            return await apiClient.request({ url: 'custom_icon_repos:list' });
          }
        })(),
      ]);
      setRepos(res?.data?.data || res?.data || []);
      setLocalIcons(customIconsManager.getAllIcons());
    } catch (err: any) {
      console.error('Failed to fetch icon repos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
    const unsub = customIconsManager.subscribe(() => {
      setLocalIcons(customIconsManager.getAllIcons());
    });
    return unsub;
  }, []);

  // 执行官方平台探测（支持 Iconify、Iconmonstr、Streamline 及 Iconfont 平台）
  const handleProbe = async () => {
    const raw = customInput.trim();
    if (!raw) {
      message.warning('请输入图标集前缀或链接，例如：solar、iconmonstr 或 https://www.iconfont.cn/collections/detail?cid=54546');
      return;
    }

    // 1. 优先智能识别 Iconfont 链接或含有合辑 ID
    if (/iconfont\.cn/i.test(raw) || /(?:cid|id)=\d+/i.test(raw)) {
      setProbing(true);
      try {
        let res: any = null;
        try {
          res = await apiClient.request({
            url: 'customIconRepos:probeIconfont',
            params: { input: raw },
          });
        } catch (e1) {
          res = await apiClient.request({
            url: 'custom_icon_repos:probeIconfont',
            params: { input: raw },
          });
        }
        const data = res?.data?.data || res?.data;
        if (data && (data.title || data.cid)) {
          setProbeResult({
            prefix: `iconfont-${data.cid}`,
            title: data.title,
            total: data.total,
            author: data.creator || 'Iconfont 平台',
            license: 'Iconfont 官方素材 (商业/个人使用请遵循原作者规范)',
            category: data.category || data.title,
            samples: (data.samples || []).map((s: any) => s.name || s.id),
            homepage: data.homepage,
            sourcePlatform: 'iconfont',
            rawIconfontData: data,
          });
          setProbeCustomTitle(data.title || `Iconfont合辑_${data.cid}`);
          setProbeCustomCategory(data.category || data.title);
          setProbeCustomDescription(data.description || '');
          message.success(`成功探测到 Iconfont [${data.title}] 合辑，共 ${data.total} 款矢量图标！`);
        } else {
          message.error('未检索到 Iconfont 合辑信息，请确认链接或合辑 ID 是否有效');
        }
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || '探测 Iconfont 合辑失败');
      } finally {
        setProbing(false);
      }
      return;
    }

    // 2. 原有 Streamline / Iconmonstr / Iconify 探测
    setProbing(true);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:probe',
          params: { prefix: raw },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:probe',
          params: { prefix: raw },
        });
      }

      const data: ProbeResult = res?.data?.data || res?.data;
      if (data && data.title) {
        setProbeResult(data);
        setProbeCustomTitle(data.title);
        setProbeCustomCategory(data.category || data.title);
        setProbeCustomDescription('');
        message.success(`成功探测到 [${data.title}] 图标集，共 ${data.total} 款矢量图标！`);
      } else {
        message.error('未检索到有效的集合信息，请确认前缀名称是否正确');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '探测失败，请确认图标集前缀是否正确');
    } finally {
      setProbing(false);
    }
  };

  // Iconfont 专属弹窗探测操作
  const handleProbeIconfontModal = async () => {
    if (!iconfontInput.trim()) {
      message.warning('请输入 Iconfont 合辑链接或合辑 ID（例如 54546）');
      return;
    }
    setIconfontProbing(true);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:probeIconfont',
          params: { input: iconfontInput.trim() },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:probeIconfont',
          params: { input: iconfontInput.trim() },
        });
      }
      const data = res?.data?.data || res?.data;
      if (data && (data.title || data.cid)) {
        setIconfontProbeData(data);
        setIconfontCustomTitle(data.title || `Iconfont合辑_${data.cid}`);
        setIconfontCustomCategory(data.title || `iconfont_${data.cid}`);
        setIconfontCustomDescription(data.description || '');
        message.success(`成功探测到 [${data.title}] 合辑，共 ${data.total} 款矢量图标！`);
      } else {
        message.error('未找到该合辑，请确认链接或 ID 是否有效');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '探测合辑失败');
    } finally {
      setIconfontProbing(false);
    }
  };

  // Iconfont 专属弹窗确认导入操作
  const handleImportIconfontModal = async () => {
    if (!iconfontProbeData) return;
    setIconfontImporting(true);
    const finalTitle = iconfontCustomTitle.trim() || iconfontProbeData.title;
    const finalCategory = iconfontCustomCategory.trim() || iconfontProbeData.title;
    const finalDescription = iconfontCustomDescription.trim() || iconfontProbeData.description;

    const hide = message.loading(`正在拉取并入库 [${finalTitle}] 的全部矢量图标...`, 0);
    try {
      let res: any = null;
      const payload = {
        input: iconfontProbeData.cid,
        title: finalTitle,
        category: finalCategory,
        description: finalDescription,
      };
      try {
        res = await apiClient.request({
          url: 'customIconRepos:importIconfont',
          method: 'post',
          data: payload,
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:importIconfont',
          method: 'post',
          data: payload,
        });
      }
      const result = res?.data?.data || res?.data || {};
      message.success(
        `导入成功！已将 [${finalTitle}] 的 ${result.total || iconfontProbeData.total} 款图标添加到分类 [${result.category || finalCategory}]！`,
      );
      await customIconsManager.loadIcons(apiClient);
      await fetchRepos();
      if (onRepoChanged) onRepoChanged();
      setIconfontModalVisible(false);
      setIconfontProbeData(null);
      setIconfontInput('');
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '导入 Iconfont 合辑失败');
    } finally {
      hide();
      setIconfontImporting(false);
    }
  };

  // 安装指定的仓库（预置或探测到的自定义库）
  const handleInstall = async (
    repoKey: string,
    title: string,
    categoryName?: string,
    iconCount?: number,
    description?: string,
  ) => {
    if (repoKey === 'iconmonstr') {
      openIconmonstrCrawlModal(0);
      return;
    }

    // A. Iconfont 合辑导入处理
    if (repoKey.startsWith('iconfont-') || (probeResult && probeResult.sourcePlatform === 'iconfont')) {
      setOperatingKey(repoKey);
      const hideMsg = message.loading(`正在从 Iconfont 拉取并导入 [${title}] 的全部矢量图标...`, 0);
      try {
        const cid = repoKey.replace(/^iconfont-/, '') || (probeResult as any)?.rawIconfontData?.cid;
        let res: any = null;
        const payload = {
          input: cid,
          title,
          category: categoryName || title,
          description,
        };
        try {
          res = await apiClient.request({
            url: 'customIconRepos:importIconfont',
            method: 'post',
            data: payload,
          });
        } catch (e1) {
          res = await apiClient.request({
            url: 'custom_icon_repos:importIconfont',
            method: 'post',
            data: payload,
          });
        }
        const result = res?.data?.data || res?.data || {};
        message.success(
          `恭喜！成功从 Iconfont 导入 [${title}]，共 ${result.total || result.created || 0} 个矢量图标！已归入分类 [${result.category || categoryName || title}]`,
        );
        await customIconsManager.loadIcons(apiClient);
        await fetchRepos();
        if (onRepoChanged) onRepoChanged();
        if (probeResult && probeResult.prefix === repoKey) {
          setProbeResult(null);
          setCustomInput('');
        }
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || '导入 Iconfont 合辑失败');
      } finally {
        hideMsg();
        setOperatingKey(null);
      }
      return;
    }

    // B. Iconify / 草莓等其它仓库安装处理
    setOperatingKey(repoKey);
    const hideMsg = message.loading(`正在下载并解析 [${title}]，请稍候...`, 0);
    try {
      let res: any = null;
      const payload = {
        key: repoKey,
        title,
        category: categoryName || repoKey,
        description,
      };

      try {
        res = await apiClient.request({
          url: 'customIconRepos:install',
          method: 'post',
          data: payload,
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:install',
          method: 'post',
          data: payload,
        });
      }

      const result = res?.data?.data || res?.data || {};
      message.success(
        `恭喜！成功导入 [${title}]，共导入 ${result.total || iconCount || 0} 个矢量图标！已自动分类至 [${result.category || categoryName || repoKey}]`,
      );

      // 重新加载全局图标数据，让界面与选择器即时生效
      await customIconsManager.loadIcons(apiClient);
      await fetchRepos();
      if (onRepoChanged) onRepoChanged();

      // 如果是自定义探测安装，清空探测结果
      if (probeResult && probeResult.prefix === repoKey) {
        setProbeResult(null);
        setCustomInput('');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '安装失败，请检查网络或稍后重试');
    } finally {
      hideMsg();
      setOperatingKey(null);
    }
  };

  // 打开修改仓库配置弹窗
  const handleOpenEditRepoModal = (repo: IconRepoItem) => {
    setEditingRepo(repo);
    setEditTitle(repo.title || repo.key);
    setEditCategory(repo.category || repo.key);
    setEditDescription(repo.description || '');
    setEditHomepage(repo.homepage || '');
    setEditModalVisible(true);
  };

  // 保存修改后的仓库配置（自动级联更新关联图标的所属分类）
  const handleSaveEditRepo = async () => {
    if (!editingRepo) return;
    const trimmedTitle = editTitle.trim();
    const trimmedCategory = editCategory.trim();
    if (!trimmedTitle) {
      message.error('仓库标题不能为空');
      return;
    }
    if (!trimmedCategory) {
      message.error('所属分类名称不能为空');
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        key: editingRepo.key,
        title: trimmedTitle,
        category: trimmedCategory,
        description: editDescription.trim(),
        homepage: editHomepage.trim(),
      };

      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:updateRepo',
          method: 'post',
          data: payload,
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:updateRepo',
          method: 'post',
          data: payload,
        });
      }

      const result = res?.data?.data || res?.data || {};
      const affected = result.affectedIconsCount || 0;
      if (affected > 0) {
        message.success(
          `修改配置成功！已同步更新仓库信息，并将 ${affected} 款图标分类同步变更至 [${trimmedCategory}]！`,
        );
      } else {
        message.success(`修改配置成功！已更新仓库 [${trimmedTitle}] 的配置。`);
      }

      await customIconsManager.loadIcons(apiClient);
      await fetchRepos();
      if (onRepoChanged) onRepoChanged();
      setEditModalVisible(false);
      setEditingRepo(null);
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || '保存仓库配置失败');
    } finally {
      setSavingEdit(false);
    }
  };

  // 打开 Iconmonstr 分页面抓取面板
  const openIconmonstrCrawlModal = (currentInstalledCount = 0) => {
    setCrawlTotalInstalled(currentInstalledCount);
    const estimatedNextPage = Math.min(80, Math.floor(currentInstalledCount / 60) + 1);
    setCrawlStartPage(estimatedNextPage);
    setCrawlCurrentPage(estimatedNextPage);
    setCrawlEndPage(80);
    setCrawlLogText(`就绪：准备从第 ${estimatedNextPage} 页爬取至第 80 页（当前本地已入库 ${currentInstalledCount} 款）\n`);
    setCrawlModalVisible(true);
  };

  // 开始执行分页面连续爬取
  const handleStartCrawl = async () => {
    if (crawlStartPage > crawlEndPage) {
      message.warning('起始页码不能大于结束页码');
      return;
    }
    setCrawlRunning(true);
    stopCrawlRef.current = false;
    let accumulated = crawlTotalInstalled;

    for (let p = crawlStartPage; p <= crawlEndPage; p++) {
      if (stopCrawlRef.current) {
        setCrawlLogText((prev) => `[已暂停] 任务已手动暂停，当前停留于第 ${p - 1} 页。\n` + prev);
        break;
      }
      setCrawlCurrentPage(p);
      setCrawlLogText((prev) => `[${new Date().toLocaleTimeString()}] 正在抓取第 ${p} / ${crawlEndPage} 页 (每页约60款，请稍候)...\n` + prev);
      try {
        let res: any = null;
        const reqData = { repoKey: 'iconmonstr', page: p, category: 'iconmonstr' };
        try {
          res = await apiClient.request({
            url: 'customIconRepos:crawlPage',
            method: 'post',
            data: reqData,
          });
        } catch (e) {
          res = await apiClient.request({
            url: 'custom_icon_repos:crawlPage',
            method: 'post',
            data: reqData,
          });
        }

        const resData = res?.data?.data || res?.data || {};
        accumulated = resData.totalInstalled || (accumulated + (resData.pageItemCount || 0));
        setCrawlTotalInstalled(accumulated);
        setCrawlLogText(
          (prev) =>
            `[${new Date().toLocaleTimeString()}] ✓ 第 ${p} 页完成！本页拉取: ${resData.pageItemCount || 0} 款，当前累计已入库: ${accumulated} 款\n` + prev,
        );

        if (resData.hasNextPage === false) {
          setCrawlLogText((prev) => `[${new Date().toLocaleTimeString()}] 🏁 已检测到官方末页，全量爬取完成！\n` + prev);
          break;
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (err: any) {
        setCrawlLogText(
          (prev) => `[${new Date().toLocaleTimeString()}] ⚠ 第 ${p} 页请求出错: ${err?.response?.data?.message || err?.message}，继续下一页...\n` + prev,
        );
      }
    }

    setCrawlRunning(false);
    await customIconsManager.loadIcons(apiClient);
    await fetchRepos();
    if (onRepoChanged) onRepoChanged();
  };

  // 暂停爬取
  const handleStopCrawl = () => {
    stopCrawlRef.current = true;
    setCrawlRunning(false);
  };

  // 卸载已安装的仓库
  const handleUninstall = async (repoKey: string, title: string) => {
    setOperatingKey(repoKey);
    try {
      let res: any = null;
      try {
        res = await apiClient.request({
          url: 'customIconRepos:uninstall',
          method: 'post',
          data: { key: repoKey },
        });
      } catch (e1) {
        res = await apiClient.request({
          url: 'custom_icon_repos:uninstall',
          method: 'post',
          data: { key: repoKey },
        });
      }

      const result = res?.data?.data || res?.data || {};
      message.success(`[${title}] 已卸载，已清理 ${result.removedCount || 0} 个关联图标`);
      await customIconsManager.loadIcons(apiClient);
      await fetchRepos();
      if (onRepoChanged) onRepoChanged();
    } catch (err: any) {
      message.error(err?.message || '卸载失败');
    } finally {
      setOperatingKey(null);
    }
  };

  // 渲染单个预览图标（本地已安装 SVG 优先，未安装则使用官方实时 CDN SVG）
  const renderSinglePreview = (
    prefix: string,
    iconName: string,
    isInstalled: boolean,
    sourceType?: string,
  ) => {
    const cleanName = iconName.includes(':') ? iconName.split(':')[1] : iconName;
    const fullName = `${prefix}:${cleanName}`;

    const previewItemBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#fff';
    const previewItemBorder = isInstalled
      ? (isDark ? '1px solid rgba(82, 196, 26, 0.5)' : '1px solid #b7eb8f')
      : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e8e8e8');
    const badgeBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#fafafa';
    const badgeBorder = isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #d9d9d9';
    const badgeColor = isDark ? token.colorTextTertiary : '#8c8c8c';

    // 1. 本地已安装图标优先（无论来自草莓还是 Iconify）
    const localIcon = customIconsManager
      .getAllIcons()
      .find((i) => i.name === fullName || i.name === cleanName || i.name === iconName);

    if (localIcon?.svg) {
      return (
        <Tooltip title={localIcon.title ? `${localIcon.title} (${localIcon.name})` : localIcon.name} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: previewItemBg,
              border: previewItemBorder,
              fontSize: 18,
              color: isInstalled ? '#52c41a' : (isDark ? '#4096ff' : '#1677ff'),
              transition: 'all 0.2s',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localIcon.svg) }}
          />
        </Tooltip>
      );
    }

    // 2. 草莓库未安装或本地未命中的预设高保真矢量
    if (sourceType === 'zip' || prefix === 'caomei') {
      const localSvg = REAL_CAOMEI_PREVIEWS[iconName] || REAL_CAOMEI_PREVIEWS[cleanName] || '';
      if (localSvg) {
        return (
          <Tooltip title={iconName} key={iconName}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: previewItemBg,
                border: previewItemBorder,
                fontSize: 18,
                color: isInstalled ? '#52c41a' : (isDark ? '#4096ff' : '#1677ff'),
                transition: 'all 0.2s',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localSvg) }}
            />
          </Tooltip>
        );
      }
      // 草莓库为国内开源独立库，不属于 Iconify 平台，若无 SVG 则使用精致文字徽标，不走 Iconify CDN 以免 404
      return (
        <Tooltip title={iconName} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: badgeBg,
              border: badgeBorder,
              fontSize: 11,
              fontWeight: 600,
              color: badgeColor,
            }}
          >
            {cleanName.slice(0, 2).toUpperCase()}
          </div>
        </Tooltip>
      );
    }

    // 3. Iconmonstr 库未安装时的预设高保真黑白矢量预览
    if (sourceType === 'iconmonstr' || prefix === 'iconmonstr') {
      const localSvg = REAL_ICONMONSTR_PREVIEWS[iconName] || REAL_ICONMONSTR_PREVIEWS[cleanName] || '';
      if (localSvg) {
        return (
          <Tooltip title={iconName} key={iconName}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: previewItemBg,
                border: previewItemBorder,
                fontSize: 18,
                color: isInstalled ? '#52c41a' : (isDark ? token.colorText : '#262626'),
                transition: 'all 0.2s',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localSvg) }}
            />
          </Tooltip>
        );
      }
      return (
        <Tooltip title={iconName} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: badgeBg,
              border: badgeBorder,
              fontSize: 11,
              fontWeight: 600,
              color: badgeColor,
            }}
          >
            {cleanName.slice(0, 2).toUpperCase()}
          </div>
        </Tooltip>
      );
    }

    // 3.5 Iconfont 平台合辑图标预览（优先从 probeResult 中获取矢量 SVG）
    if (sourceType === 'iconfont' || prefix.startsWith('iconfont')) {
      const matchedSample = probeResult?.rawIconfontData?.samples?.find(
        (s: any) => s.name === iconName || s.name === cleanName || String(s.id) === String(cleanName),
      );
      if (matchedSample?.show_svg) {
        return (
          <Tooltip title={matchedSample.name || iconName} key={iconName}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: previewItemBg,
                border: isInstalled
                  ? (isDark ? '1px solid rgba(82, 196, 26, 0.5)' : '1px solid #b7eb8f')
                  : (isDark ? '1px solid rgba(255, 68, 0, 0.4)' : '1px solid #ffbb96'),
                fontSize: 18,
                color: isInstalled ? '#52c41a' : '#ff4400',
                transition: 'all 0.2s',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(matchedSample.show_svg) }}
            />
          </Tooltip>
        );
      }
      return (
        <Tooltip title={iconName} key={iconName}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: isDark ? 'rgba(255, 68, 0, 0.08)' : '#fffaf8',
              border: isDark ? '1px dashed rgba(255, 68, 0, 0.3)' : '1px dashed #ffbb96',
              fontSize: 11,
              fontWeight: 600,
              color: isDark ? '#ff7a45' : '#d4380d',
            }}
          >
            {cleanName.slice(0, 2).toUpperCase()}
          </div>
        </Tooltip>
      );
    }

    // 4. Iconify 官方在线实时 SVG 图（带错误自动兜底防裂图）
    const onlineColor = isDark ? '%234096ff' : '%231677ff';
    const onlineSvgUrl = `https://api.iconify.design/${prefix}/${cleanName}.svg?color=${onlineColor}`;
    return (
      <Tooltip title={fullName} key={iconName}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: previewItemBg,
            border: previewItemBorder,
            padding: 5,
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <img
            src={onlineSvgUrl}
            alt={fullName}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            loading="lazy"
            onError={(e) => {
              // 图片加载失败（如网络中断或 404）时隐藏自身，显示优雅文字徽标，彻底杜绝浏览器裂图
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-badge')) {
                const badge = document.createElement('span');
                badge.className = 'fallback-badge';
                badge.style.fontSize = '11px';
                badge.style.fontWeight = '600';
                badge.style.color = isDark ? 'rgba(255, 255, 255, 0.35)' : '#bfbfbf';
                badge.innerText = cleanName.slice(0, 2).toUpperCase();
                parent.appendChild(badge);
              }
            }}
          />
        </div>
      </Tooltip>
    );
  };

  // 根据分类标签与搜索过滤
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      // 分类筛选
      if (activeCategoryFilter === 'installed' || activeCategoryFilter === '已安装') {
        const isInstalled = r.status === 'installed' || (r.installedCount && r.installedCount > 0);
        if (!isInstalled) return false;
      } else if (activeCategoryFilter !== 'all') {
        const tags = r.tags || [];
        if (!tags.includes(activeCategoryFilter)) return false;
      }

      // 关键词搜索
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const inTitle = (r.title || '').toLowerCase().includes(kw);
        const inKey = (r.key || '').toLowerCase().includes(kw);
        const inDesc = (r.description || '').toLowerCase().includes(kw);
        const inCategory = (r.category || '').toLowerCase().includes(kw);
        return inTitle || inKey || inDesc || inCategory;
      }
      return true;
    });
  }, [repos, activeCategoryFilter, searchKeyword]);

  return (
    <div style={{ marginTop: 12 }}>
      {/* 顶部提示横幅 */}
      <Alert
        message="海量图标集支持与高可用持久化机制"
        description={
          <div>
            支持直连导入{' '}
            <a href="https://www.iconfont.cn/" target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: '#ff4400' }}>
              阿里巴巴 Iconfont (iconfont.cn)
            </a>{' '}
            、{' '}
            <a href="https://www.streamlinehq.com/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Streamline HQ (streamlinehq.com)
            </a>{' '}
            、{' '}
            <a href="https://iconmonstr.com/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Iconmonstr (iconmonstr.com)
            </a>{' '}
            与{' '}
            <a href="https://icon-sets.iconify.design/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
              Iconify 官方图标集平台 (icon-sets.iconify.design)
            </a>{' '}
            的海量开源矢量图标（覆盖 150+ 主流图标库与 200,000+ 矢量图标）。所有已安装的图标均由系统核心数据库与本地文件双重持久化保存，系统升级或重启永久有效。
          </div>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
        style={{ marginBottom: 20, borderRadius: 8 }}
      />

      {/* 自定义 Streamline / Iconmonstr / Iconify / Iconfont 图标集快速导入面板 */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 8,
          background: isDark
            ? 'linear-gradient(135deg, rgba(22, 119, 255, 0.12) 0%, rgba(22, 119, 255, 0.03) 100%)'
            : 'linear-gradient(135deg, #f0f5ff 0%, #fafcff 100%)',
          borderColor: isDark ? 'rgba(22, 119, 255, 0.35)' : '#adc6ff',
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 320, maxWidth: 680 }}>
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onPressEnter={handleProbe}
              placeholder="输入前缀或链接：例如 solar、streamline、Iconfont 链接或 iconmonstr.com"
              allowClear
              prefix={<CompassOutlined style={{ color: '#8c8c8c' }} />}
              style={{ borderRadius: 6 }}
            />
            <Button
              type="primary"
              icon={probing ? <SyncOutlined spin /> : <SearchOutlined />}
              onClick={handleProbe}
              loading={probing}
              style={{ borderRadius: 6, flexShrink: 0 }}
            >
              探测并导入
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              style={{ backgroundColor: '#ff4400', borderColor: '#ff4400', borderRadius: 6 }}
              icon={<CloudDownloadOutlined />}
              onClick={() => setIconfontModalVisible(true)}
            >
              从 Iconfont 导入合辑
            </Button>
            <Space size={8} style={{ fontSize: 13 }}>
              <a href="https://www.iconfont.cn/" target="_blank" rel="noreferrer" style={{ color: '#ff4400', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <GlobalOutlined /> Iconfont
              </a>
              <Divider type="vertical" style={{ margin: 0 }} />
              <a href="https://www.streamlinehq.com/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <GlobalOutlined /> Streamline
              </a>
              <Divider type="vertical" style={{ margin: 0 }} />
              <a href="https://iconmonstr.com/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <GlobalOutlined /> Iconmonstr
              </a>
              <Divider type="vertical" style={{ margin: 0 }} />
              <a href="https://icon-sets.iconify.design/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <GlobalOutlined /> Iconify
              </a>
            </Space>
          </div>
        </div>

        {/* 探测成功后展示的集合预览卡片 */}
        {probeResult && (
          <Card
            style={{
              marginTop: 16,
              borderRadius: 6,
              backgroundColor: token.colorBgContainer,
              borderColor: probeResult.sourcePlatform === 'iconfont'
                ? (isDark ? 'rgba(255, 68, 0, 0.4)' : '#ffbb96')
                : (isDark ? 'rgba(22, 119, 255, 0.4)' : '#69b1ff'),
              boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 2px 8px rgba(22, 119, 255, 0.08)',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Title level={5} style={{ margin: 0, color: probeResult.sourcePlatform === 'iconfont' ? (isDark ? '#ff7a45' : '#d4380d') : (isDark ? '#4096ff' : '#1677ff') }}>
                  {probeResult.title} ({probeResult.prefix})
                </Title>
                <Space size={8} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                  <Tag color={probeResult.sourcePlatform === 'iconfont' ? 'volcano' : 'cyan'}>
                    {probeResult.total} 款矢量图标
                  </Tag>
                  <Tag color="purple">作者: {probeResult.author}</Tag>
                  <Tag color="orange">来源: {probeResult.sourcePlatform === 'iconfont' ? '阿里巴巴 Iconfont' : probeResult.license}</Tag>
                  <Tag color="blue">当前分类: {probeCustomCategory || probeResult.category}</Tag>
                </Space>
              </div>

              <Space>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  href={probeResult.homepage}
                  target="_blank"
                >
                  官方预览
                </Button>
                {probeResult.prefix === 'iconmonstr' ? (
                  <Button
                    type="primary"
                    icon={<CloudDownloadOutlined />}
                    onClick={() => openIconmonstrCrawlModal(0)}
                  >
                    分页面拉取所有页面
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    style={
                      probeResult.sourcePlatform === 'iconfont'
                        ? { backgroundColor: '#ff4400', borderColor: '#ff4400' }
                        : undefined
                    }
                    icon={operatingKey === probeResult.prefix ? <SyncOutlined spin /> : <DownloadOutlined />}
                    loading={operatingKey === probeResult.prefix}
                    onClick={() =>
                      handleInstall(
                        probeResult.prefix,
                        probeCustomTitle.trim() || probeResult.title,
                        probeCustomCategory.trim() || probeResult.category,
                        probeResult.total,
                        probeCustomDescription.trim() || undefined,
                      )
                    }
                  >
                    确认导入并安装
                  </Button>
                )}
              </Space>
            </div>

            {/* 用户自定义导入配置项：标题与分类 */}
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 6,
                backgroundColor: isDark
                  ? (probeResult.sourcePlatform === 'iconfont' ? 'rgba(255, 68, 0, 0.08)' : 'rgba(22, 119, 255, 0.08)')
                  : (probeResult.sourcePlatform === 'iconfont' ? '#fffaf8' : '#f8faff'),
                border: '1px solid ' + (isDark
                  ? (probeResult.sourcePlatform === 'iconfont' ? 'rgba(255, 68, 0, 0.3)' : 'rgba(22, 119, 255, 0.3)')
                  : (probeResult.sourcePlatform === 'iconfont' ? '#ffd8bf' : '#d6e4ff')),
              }}
            >
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8, color: isDark ? token.colorText : '#262626' }}>
                <SettingOutlined style={{ marginRight: 6 }} />自定义入库配置（可在此自由修改标题与分类）：
              </Text>
              <Row gutter={[12, 8]}>
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text type="secondary" style={{ width: 70, flexShrink: 0 }}>合辑标题：</Text>
                    <Input
                      size="small"
                      value={probeCustomTitle}
                      onChange={(e) => setProbeCustomTitle(e.target.value)}
                      placeholder="自定义图标库标题"
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text type="secondary" style={{ width: 70, flexShrink: 0 }}>归属分类：</Text>
                    <Input
                      size="small"
                      value={probeCustomCategory}
                      onChange={(e) => setProbeCustomCategory(e.target.value)}
                      placeholder="分类名称，例如：社交功能"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {probeResult.samples && probeResult.samples.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  典型图标预览（实时从官方抓取展示）：
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {probeResult.samples.slice(0, 12).map((sampleName) =>
                    renderSinglePreview(
                      probeResult.prefix,
                      sampleName,
                      false,
                      probeResult.sourcePlatform || 'iconify',
                    ),
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </Card>

      {/* 筛选与搜索工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Radio.Group
          value={activeCategoryFilter}
          onChange={(e) => setActiveCategoryFilter(e.target.value)}
          buttonStyle="solid"
          size="middle"
        >
          <Radio.Button value="all">
            <AppstoreOutlined /> 全部图标库
          </Radio.Button>
          <Radio.Button value="精选推荐">精选推荐</Radio.Button>
          <Radio.Button value="通用系统UI">通用系统UI</Radio.Button>
          <Radio.Button value="StreamlineHQ">Streamline HQ</Radio.Button>
          <Radio.Button value="Iconmonstr">Iconmonstr</Radio.Button>
          <Radio.Button value="Iconfont">Iconfont</Radio.Button>
          <Radio.Button value="品牌Logo">品牌 Logo</Radio.Button>
          <Radio.Button value="已安装">已安装</Radio.Button>
        </Radio.Group>

        <Search
          placeholder="按名称、前缀或分类过滤..."
          allowClear
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {/* 图标库卡片网格 */}
      <Spin spinning={loading}>
        {filteredRepos.length === 0 ? (
          <Empty
            style={{ margin: '48px 0' }}
            description={
              activeCategoryFilter === 'installed' || activeCategoryFilter === '已安装'
                ? '暂无已安装的图标库，可在上方「精选推荐」或「全部图标库」中一键安装'
                : '没有找到匹配的图标库'
            }
          />
        ) : (
          <Row gutter={[20, 20]}>
          {filteredRepos.map((repo) => {
            const isInstalled =
              repo.status === 'installed' || (repo.installedCount && repo.installedCount > 0);
            const isOperating = operatingKey === repo.key;

            return (
              <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={6} key={repo.key}>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 8,
                    borderColor: isInstalled
                      ? (isDark ? 'rgba(82, 196, 26, 0.6)' : '#b7eb8f')
                      : (isDark ? 'rgba(255, 255, 255, 0.12)' : '#e8e8e8'),
                    boxShadow: isInstalled ? '0 2px 8px rgba(82, 196, 26, 0.12)' : undefined,
                    transition: 'all 0.3s',
                  }}
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 14px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <Title
                        level={5}
                        style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <ShoppingOutlined style={{ color: '#1677ff' }} />
                        {repo.title}
                        {repo.prefix && <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>({repo.prefix})</Text>}
                      </Title>
                      <Space size={6} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                        <Tag color="blue">v{repo.version}</Tag>
                        <Tag color="cyan">{repo.iconCount} 款图标</Tag>
                        <Tag color="geekblue">分类: {repo.category}</Tag>
                        {(repo.tags || []).map((t) => (
                          <Tag
                            key={t}
                            color={
                              t === 'StreamlineHQ'
                                ? 'purple'
                                : t === 'Iconmonstr'
                                ? 'volcano'
                                : t === '精选推荐'
                                ? 'gold'
                                : t === '品牌Logo'
                                ? 'magenta'
                                : undefined
                            }
                          >
                            {t}
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {isInstalled ? (
                      <Space size={6} style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                          style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4 }}
                        >
                          已安装 ({repo.installedCount || repo.iconCount})
                        </Tag>
                        {repo.installedCount && repo.iconCount && repo.installedCount < repo.iconCount ? (
                          <Tag color="warning" style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4 }}>
                            可扩容至 {repo.iconCount} 款
                          </Tag>
                        ) : null}
                      </Space>
                    ) : (
                      <Tag color="default" style={{ padding: '4px 8px', fontSize: 13, borderRadius: 4 }}>
                        未安装
                      </Tag>
                    )}
                  </div>

                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 13, marginBottom: 14, minHeight: 38 }}
                  >
                    {repo.description}
                  </Paragraph>

                  {/* 图标展示区 */}
                  <div
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
                      padding: '10px 12px',
                      borderRadius: 6,
                      marginBottom: 14,
                      border: '1px dashed ' + (isDark ? 'rgba(255, 255, 255, 0.15)' : '#e8e8e8'),
                    }}
                  >
                    {(() => {
                      const previewCount = customIconsManager.getPaginationConfig().marketPreviewCount || 10;

                      // 1. 已安装状态下：直接从本地已加载的图标池中精确匹配属于该仓库的前 N 个图标
                      if (isInstalled) {
                        const matchedLocalIcons = localIcons.filter((i) => {
                          if (repo.sourceType === 'iconfont') {
                            const cid = repo.key.replace(/^iconfont-/, '');
                            if (i.source === `iconfont:${cid}` || i.name.startsWith(`iconfont:${cid}_`)) return true;
                          }
                          if (repo.category && i.category && i.category === repo.category) return true;
                          if (repo.sourceType === 'iconify') {
                            const p = repo.prefix || repo.key;
                            if (i.source === `iconify:${p}` || i.name.startsWith(`${p}:`)) return true;
                          }
                          if (repo.key === 'iconmonstr' || repo.sourceType === 'iconmonstr') {
                            if (i.source === 'iconmonstr' || i.source === 'repo:iconmonstr' || i.category === 'iconmonstr') return true;
                          }
                          if (repo.key === 'caomei' || repo.sourceType === 'zip') {
                            if (i.source === 'caomei' || i.source === 'repo:caomei' || i.category === '草莓图标库 (Caomei)') return true;
                          }
                          return false;
                        });

                        if (matchedLocalIcons.length > 0) {
                          const topN = matchedLocalIcons.slice(0, previewCount);
                          return (
                            <>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: isDark ? token.colorTextTertiary : '#8c8c8c',
                                  marginBottom: 8,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                fontFamily: 'inherit',
                                }}
                              >
                                <span>典型图标展示：</span>
                                <span style={{ color: '#52c41a' }}>已入库 (显示前 {topN.length} 个)</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {topN.map((localIcon) => (
                                  <Tooltip
                                    title={localIcon.title ? `${localIcon.title} (${localIcon.name})` : localIcon.name}
                                    key={localIcon.name}
                                  >
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: 6,
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#fff',
                                        border: isDark ? '1px solid rgba(82, 196, 26, 0.5)' : '1px solid #b7eb8f',
                                        fontSize: 18,
                                        color: '#52c41a',
                                        transition: 'all 0.2s',
                                      }}
                                      dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(localIcon.svg) }}
                                    />
                                  </Tooltip>
                                ))}
                              </div>
                            </>
                          );
                        }
                      }

                      // 2. 若未安装或本地尚未查到，则从 repo.previewIcons 中展示前 N 个
                      const previewList = (repo.previewIcons || []).slice(0, previewCount);
                      return (
                        <>
                          <div
                            style={{
                              fontSize: 12,
                              color: isDark ? token.colorTextTertiary : '#8c8c8c',
                              marginBottom: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>典型图标展示：</span>
                            <span>{isInstalled ? '本地已加载' : '官方在线实时预览'}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {previewList.length > 0 ? (
                              previewList.map((iconName) =>
                                renderSinglePreview(
                                  repo.prefix || repo.key,
                                  iconName,
                                  Boolean(isInstalled),
                                  repo.sourceType,
                                ),
                              )
                            ) : (
                              <div style={{ fontSize: 12, color: isDark ? token.colorTextQuaternary : '#bfbfbf', padding: '6px 0' }}>
                                {isInstalled ? '暂无图标预览' : '未提供预览'}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* 底部操作工具栏 */}
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid ' + (isDark ? 'rgba(255, 255, 255, 0.08)' : '#f0f0f0'),
                    }}
                  >
                    <Button
                      type="link"
                      icon={<LinkOutlined />}
                      href={repo.homepage}
                      target="_blank"
                      style={{ padding: 0 }}
                    >
                      访问主页
                    </Button>

                    <Space>
                      {repo.key === 'iconmonstr' ? (
                        <>
                          <Button
                            type="primary"
                            icon={<CloudDownloadOutlined />}
                            onClick={() => openIconmonstrCrawlModal(repo.installedCount || 0)}
                          >
                            {isInstalled ? '分页面拉取更多页面' : '分页面拉取所有页面'}
                          </Button>
                          {isInstalled ? (
                            <>
                              <Button
                                icon={<EditOutlined />}
                                onClick={() => handleOpenEditRepoModal(repo)}
                              >
                                修改配置
                              </Button>
                              <Popconfirm
                                title={`确认卸载 [${repo.title}]？`}
                                description="卸载后将清空已导入的该库图标（不影响用户手动上传的图标）。"
                                okText="卸载"
                                cancelText="取消"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => handleUninstall(repo.key, repo.title)}
                              >
                                <Button danger icon={<DeleteOutlined />} loading={isOperating}>
                                  一键卸载
                                </Button>
                              </Popconfirm>
                            </>
                          ) : null}
                        </>
                      ) : isInstalled ? (
                        <>
                          {repo.installedCount && repo.iconCount && repo.installedCount < repo.iconCount ? (
                            <Button
                              type="primary"
                              icon={<CloudDownloadOutlined />}
                              loading={isOperating}
                              onClick={() =>
                                handleInstall(repo.key, repo.title, repo.category, repo.iconCount)
                              }
                            >
                              扩容更新 ({repo.installedCount} → {repo.iconCount})
                            </Button>
                          ) : null}
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditRepoModal(repo)}
                          >
                            修改配置
                          </Button>
                          <Popconfirm
                            title={`确认卸载 [${repo.title}]？`}
                            description="卸载后将清空已导入的该库图标（不影响用户手动上传的图标）。"
                            okText="卸载"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUninstall(repo.key, repo.title)}
                          >
                            <Button danger icon={<DeleteOutlined />} loading={isOperating}>
                              一键卸载
                            </Button>
                          </Popconfirm>
                        </>
                      ) : (
                        <Button
                          type="primary"
                          icon={isOperating ? <SyncOutlined spin /> : <DownloadOutlined />}
                          loading={isOperating}
                          onClick={() =>
                            handleInstall(repo.key, repo.title, repo.category, repo.iconCount)
                          }
                        >
                          一键下载安装
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
        )}
      </Spin>

      {/* Iconmonstr 分页面全量实时拉取进度弹窗 */}
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span>Iconmonstr 官方图标库 · 分页面实时拉取</span>
          </Space>
        }
        open={crawlModalVisible}
        onCancel={() => {
          if (crawlRunning) {
            handleStopCrawl();
          }
          setCrawlModalVisible(false);
        }}
        footer={null}
        width={680}
        destroyOnClose={false}
      >
        <div style={{ marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="分页面在线爬取机制"
            description="Iconmonstr 官方全站约 4,784 款矢量图标分布于 80 页。系统采用单页原子爬取（每页约 60 款，耗时约 10 秒），绝不超时，支持随时暂停、断点续传。"
            style={{ marginBottom: 16 }}
          />

          {/* 页码与预设档位 */}
          <div
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#fafafa',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              border: '1px solid ' + (isDark ? 'rgba(255, 255, 255, 0.08)' : '#f0f0f0'),
            }}
          >
            <div
              style={{
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <Text strong>快捷拉取档位：</Text>
              <Space wrap>
                <Button
                  size="small"
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(1);
                  }}
                >
                  精选 1 页 (60款)
                </Button>
                <Button
                  size="small"
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(5);
                  }}
                >
                  前 5 页 (~300款)
                </Button>
                <Button
                  size="small"
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(20);
                  }}
                >
                  前 20 页 (~1,200款)
                </Button>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  disabled={crawlRunning}
                  onClick={() => {
                    setCrawlStartPage(1);
                    setCrawlEndPage(80);
                  }}
                >
                  全量 80 页 (~4,784款)
                </Button>
              </Space>
            </div>

            <Row gutter={16} align="middle">
              <Col span={12}>
                <Space align="center">
                  <Text type="secondary">起始页码：</Text>
                  <InputNumber
                    min={1}
                    max={80}
                    value={crawlStartPage}
                    disabled={crawlRunning}
                    onChange={(val) => setCrawlStartPage(val || 1)}
                  />
                </Space>
              </Col>
              <Col span={12}>
                <Space align="center">
                  <Text type="secondary">结束页码：</Text>
                  <InputNumber
                    min={1}
                    max={80}
                    value={crawlEndPage}
                    disabled={crawlRunning}
                    onChange={(val) => setCrawlEndPage(val || 80)}
                  />
                  <Text type="secondary">(官网共 80 页)</Text>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 进度条与实时状态 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text strong>
                {crawlRunning
                  ? `正在抓取第 ${crawlCurrentPage} / ${crawlEndPage} 页...`
                  : `准备抓取第 ${crawlStartPage} 至 ${crawlEndPage} 页`}
              </Text>
              <Text type="secondary">
                数据库累计入库：<Text strong style={{ color: '#52c41a' }}>{crawlTotalInstalled}</Text> 款图标
              </Text>
            </div>
            <Progress
              percent={
                crawlEndPage >= crawlStartPage
                  ? Math.min(
                      100,
                      Math.round(
                        ((Math.max(crawlStartPage, crawlCurrentPage) - crawlStartPage + (crawlRunning ? 0.5 : 1)) /
                          (crawlEndPage - crawlStartPage + 1)) *
                          100,
                      ),
                    )
                  : 0
              }
              status={crawlRunning ? 'active' : 'normal'}
              strokeColor={{
                from: '#108ee9',
                to: '#87d068',
              }}
            />
          </div>

          {/* 实时控制台输出 */}
          <div style={{ marginBottom: 18 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              实时抓取日志：
            </Text>
            <Input.TextArea
              value={crawlLogText}
              readOnly
              rows={5}
              style={{
                marginTop: 4,
                fontFamily: 'monospace',
                fontSize: 12,
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
              }}
            />
          </div>

          {/* 底部控制按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {crawlRunning ? (
              <Button danger icon={<PauseCircleOutlined />} onClick={handleStopCrawl}>
                暂停抓取
              </Button>
            ) : (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartCrawl}>
                {crawlLogText.includes('已手动暂停') ? '继续抓取' : '开始分页面实时抓取'}
              </Button>
            )}
            <Button
              onClick={() => {
                if (crawlRunning) handleStopCrawl();
                setCrawlModalVisible(false);
              }}
            >
              {crawlRunning ? '中止并关闭' : '关闭'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 阿里巴巴 Iconfont 平台合辑一键导入弹窗 */}
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined style={{ color: '#ff4400' }} />
            <span>从阿里巴巴 Iconfont 平台导入矢量合辑</span>
          </Space>
        }
        open={iconfontModalVisible}
        onCancel={() => {
          if (!iconfontImporting) {
            setIconfontModalVisible(false);
          }
        }}
        footer={null}
        width={680}
        destroyOnClose
      >
        <div style={{ paddingTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="支持直接粘贴 Iconfont 公开合辑链接或纯合辑 ID，系统将免登直连拉取合辑内全部矢量图标并永久保存。"
            description="例如: https://www.iconfont.cn/collections/detail?spm=a313x.user_detail.i1.dc64b3430.1b093a81fig5tS&cid=54546 或直接输入 54546"
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Iconfont 合辑链接或合辑 ID (cid)：
            </Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={iconfontInput}
                onChange={(e) => setIconfontInput(e.target.value)}
                placeholder="例如: https://www.iconfont.cn/collections/detail?cid=54546 或 54546"
                allowClear
                onPressEnter={handleProbeIconfontModal}
                disabled={iconfontProbing || iconfontImporting}
              />
              <Button
                type="primary"
                style={{ backgroundColor: '#ff4400', borderColor: '#ff4400' }}
                icon={iconfontProbing ? <SyncOutlined spin /> : <SearchOutlined />}
                loading={iconfontProbing}
                onClick={handleProbeIconfontModal}
                disabled={iconfontImporting}
              >
                探测合辑
              </Button>
            </div>
          </div>

          {iconfontProbeData && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                borderColor: isDark ? 'rgba(255, 68, 0, 0.4)' : '#ffbb96',
                background: isDark ? 'rgba(255, 68, 0, 0.08)' : '#fffaf8',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Title level={5} style={{ margin: 0, color: isDark ? '#ff7a45' : '#d4380d' }}>
                    {iconfontProbeData.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                    {iconfontProbeData.description}
                  </Text>
                  <Space size={8} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                    <Tag color="volcano">合辑编号: {iconfontProbeData.cid}</Tag>
                    <Tag color="orange">共 {iconfontProbeData.total} 款矢量图标</Tag>
                    {iconfontProbeData.creator && <Tag color="blue">创建者: {iconfontProbeData.creator}</Tag>}
                  </Space>
                </div>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  href={iconfontProbeData.homepage}
                  target="_blank"
                >
                  在 Iconfont 查看
                </Button>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: '12px 14px',
                  borderRadius: 6,
                  backgroundColor: isDark ? token.colorBgContainer : '#fff',
                  border: '1px solid ' + (isDark ? 'rgba(255, 68, 0, 0.3)' : '#ffd8bf'),
                }}
              >
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10, color: isDark ? '#ff7a45' : '#d4380d' }}>
                  <SettingOutlined style={{ marginRight: 6 }} />入库自定义配置（可自由修改标题、分类与描述）：
                </Text>
                <Row gutter={[16, 12]}>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      合辑展示标题：
                    </Text>
                    <Input
                      value={iconfontCustomTitle}
                      onChange={(e) => setIconfontCustomTitle(e.target.value)}
                      placeholder="合辑标题，例如：社交功能"
                      disabled={iconfontImporting}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      归属分类名称：
                    </Text>
                    <Input
                      value={iconfontCustomCategory}
                      onChange={(e) => setIconfontCustomCategory(e.target.value)}
                      placeholder="分类名称，例如：社交"
                      disabled={iconfontImporting}
                    />
                  </Col>
                  <Col span={24}>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      说明与描述：
                    </Text>
                    <Input.TextArea
                      value={iconfontCustomDescription}
                      onChange={(e) => setIconfontCustomDescription(e.target.value)}
                      placeholder="合辑说明描述（可选）"
                      rows={2}
                      disabled={iconfontImporting}
                    />
                  </Col>
                </Row>
              </div>

              {iconfontProbeData.samples && iconfontProbeData.samples.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    图标预览展示（部分）：
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto', padding: 4 }}>
                    {iconfontProbeData.samples.map((item: any, idx: number) => (
                      <Tooltip title={item.name} key={item.id || idx}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#fff',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e8e8e8',
                            fontSize: 20,
                            padding: 4,
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeAndFormatSvg(item.show_svg) }}
                        />
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              onClick={() => setIconfontModalVisible(false)}
              disabled={iconfontImporting}
            >
              取消
            </Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#ff4400', borderColor: '#ff4400' }}
              icon={iconfontImporting ? <SyncOutlined spin /> : <CloudDownloadOutlined />}
              loading={iconfontImporting}
              disabled={!iconfontProbeData}
              onClick={handleImportIconfontModal}
            >
              一键导入该合辑 ({iconfontProbeData ? `${iconfontProbeData.total} 款图标` : '待探测'})
            </Button>
          </div>
        </div>
      </Modal>

      {/* 修改仓库配置弹窗（支持级联更新图标分类） */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1677ff' }} />
            <span>修改图标库配置 · {editingRepo?.title}</span>
          </Space>
        }
        open={editModalVisible}
        onCancel={() => {
          if (!savingEdit) {
            setEditModalVisible(false);
            setEditingRepo(null);
          }
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div style={{ paddingTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message="配置修改说明"
            description="修改分类名称后，系统将自动级联更新该图标库下所有已入库图标的所属分类，并在全局图标选择器与菜单中即刻同步生效。"
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              仓库唯一标识 (Key)：
            </Text>
            <Input value={editingRepo?.key || ''} disabled style={{ backgroundColor: '#f5f5f5' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              仓库展示标题 (Title)：<span style={{ color: '#ff4d4f' }}>*</span>
            </Text>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="请输入仓库展示标题"
              disabled={savingEdit}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              所属图标分类 (Category)：<span style={{ color: '#ff4d4f' }}>*</span>
            </Text>
            <Input
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              placeholder="请输入所属分类名称"
              disabled={savingEdit}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              提示：若修改此分类，数据库中归属于该仓库的所有矢量图标分类将自动同步变更。
            </Text>
          </div>

          <div style={{ marginBottom: 14 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              官方主页链接 (Homepage)：
            </Text>
            <Input
              value={editHomepage}
              onChange={(e) => setEditHomepage(e.target.value)}
              placeholder="官方或合辑主页链接"
              disabled={savingEdit}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
              说明与描述 (Description)：
            </Text>
            <Input.TextArea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="请输入关于此图标库的说明"
              rows={3}
              disabled={savingEdit}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              onClick={() => {
                setEditModalVisible(false);
                setEditingRepo(null);
              }}
              disabled={savingEdit}
            >
              取消
            </Button>
            <Button
              type="primary"
              icon={savingEdit ? <SyncOutlined spin /> : <CheckCircleOutlined />}
              loading={savingEdit}
              onClick={handleSaveEditRepo}
            >
              保存并同步生效
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default IconRepoMarket;
