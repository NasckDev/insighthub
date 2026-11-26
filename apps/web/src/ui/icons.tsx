import type { ComponentType } from 'react';
import {
  ApartmentOutlined as AntApartmentOutlined,
  ApiOutlined as AntApiOutlined,
  AppstoreOutlined as AntAppstoreOutlined,
  ArrowLeftOutlined as AntArrowLeftOutlined,
  ArrowRightOutlined as AntArrowRightOutlined,
  BarChartOutlined as AntBarChartOutlined,
  BulbOutlined as AntBulbOutlined,
  CheckCircleFilled as AntCheckCircleFilled,
  CheckOutlined as AntCheckOutlined,
  CloseCircleFilled as AntCloseCircleFilled,
  CloseOutlined as AntCloseOutlined,
  CompassOutlined as AntCompassOutlined,
  CopyOutlined as AntCopyOutlined,
  DashboardOutlined as AntDashboardOutlined,
  DeleteOutlined as AntDeleteOutlined,
  DisconnectOutlined as AntDisconnectOutlined,
  DownloadOutlined as AntDownloadOutlined,
  EditOutlined as AntEditOutlined,
  ExclamationCircleFilled as AntExclamationCircleFilled,
  FallOutlined as AntFallOutlined,
  FileMarkdownOutlined as AntFileMarkdownOutlined,
  FilterOutlined as AntFilterOutlined,
  FrownOutlined as AntFrownOutlined,
  InfoCircleFilled as AntInfoCircleFilled,
  KeyOutlined as AntKeyOutlined,
  LinkOutlined as AntLinkOutlined,
  MehOutlined as AntMehOutlined,
  MenuOutlined as AntMenuOutlined,
  MessageOutlined as AntMessageOutlined,
  MoonOutlined as AntMoonOutlined,
  PlusOutlined as AntPlusOutlined,
  PushpinOutlined as AntPushpinOutlined,
  QuestionCircleOutlined as AntQuestionCircleOutlined,
  ReloadOutlined as AntReloadOutlined,
  RiseOutlined as AntRiseOutlined,
  SearchOutlined as AntSearchOutlined,
  SmileOutlined as AntSmileOutlined,
  StopOutlined as AntStopOutlined,
  SunOutlined as AntSunOutlined,
  SwapOutlined as AntSwapOutlined,
  TableOutlined as AntTableOutlined,
  ThunderboltOutlined as AntThunderboltOutlined,
  UserOutlined as AntUserOutlined,
  WarningOutlined as AntWarningOutlined,
} from '@ant-design/icons';

/**
 * The only place where `@ant-design/icons` is imported. Screens import icons from `../ui`, so the lint
 * rule that guards the component library also guards the icon set.
 *
 * Every icon is decorative by default (`aria-hidden`): the library gives them `role="img"` and an English
 * `aria-label` ("reload"), which would otherwise leak into the name of every button that holds one.
 */
interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
}

function decorative(Icon: ComponentType<IconProps>): ComponentType<IconProps> {
  function DecorativeIcon(props: IconProps) {
    return <Icon aria-hidden="true" {...props} />;
  }
  return DecorativeIcon;
}

export const ApartmentOutlined = /*#__PURE__*/ decorative(AntApartmentOutlined);
export const ApiOutlined = /*#__PURE__*/ decorative(AntApiOutlined);
export const AppstoreOutlined = /*#__PURE__*/ decorative(AntAppstoreOutlined);
export const ArrowLeftOutlined = /*#__PURE__*/ decorative(AntArrowLeftOutlined);
export const ArrowRightOutlined = /*#__PURE__*/ decorative(AntArrowRightOutlined);
export const BarChartOutlined = /*#__PURE__*/ decorative(AntBarChartOutlined);
export const BulbOutlined = /*#__PURE__*/ decorative(AntBulbOutlined);
export const CheckCircleFilled = /*#__PURE__*/ decorative(AntCheckCircleFilled);
export const CheckOutlined = /*#__PURE__*/ decorative(AntCheckOutlined);
export const CloseCircleFilled = /*#__PURE__*/ decorative(AntCloseCircleFilled);
export const CloseOutlined = /*#__PURE__*/ decorative(AntCloseOutlined);
export const CompassOutlined = /*#__PURE__*/ decorative(AntCompassOutlined);
export const CopyOutlined = /*#__PURE__*/ decorative(AntCopyOutlined);
export const DashboardOutlined = /*#__PURE__*/ decorative(AntDashboardOutlined);
export const DeleteOutlined = /*#__PURE__*/ decorative(AntDeleteOutlined);
export const DisconnectOutlined = /*#__PURE__*/ decorative(AntDisconnectOutlined);
export const DownloadOutlined = /*#__PURE__*/ decorative(AntDownloadOutlined);
export const EditOutlined = /*#__PURE__*/ decorative(AntEditOutlined);
export const ExclamationCircleFilled = /*#__PURE__*/ decorative(AntExclamationCircleFilled);
export const FallOutlined = /*#__PURE__*/ decorative(AntFallOutlined);
export const FileMarkdownOutlined = /*#__PURE__*/ decorative(AntFileMarkdownOutlined);
export const FilterOutlined = /*#__PURE__*/ decorative(AntFilterOutlined);
export const FrownOutlined = /*#__PURE__*/ decorative(AntFrownOutlined);
export const InfoCircleFilled = /*#__PURE__*/ decorative(AntInfoCircleFilled);
export const KeyOutlined = /*#__PURE__*/ decorative(AntKeyOutlined);
export const LinkOutlined = /*#__PURE__*/ decorative(AntLinkOutlined);
export const MehOutlined = /*#__PURE__*/ decorative(AntMehOutlined);
export const MenuOutlined = /*#__PURE__*/ decorative(AntMenuOutlined);
export const MessageOutlined = /*#__PURE__*/ decorative(AntMessageOutlined);
export const MoonOutlined = /*#__PURE__*/ decorative(AntMoonOutlined);
export const PlusOutlined = /*#__PURE__*/ decorative(AntPlusOutlined);
export const PushpinOutlined = /*#__PURE__*/ decorative(AntPushpinOutlined);
export const QuestionCircleOutlined = /*#__PURE__*/ decorative(AntQuestionCircleOutlined);
export const ReloadOutlined = /*#__PURE__*/ decorative(AntReloadOutlined);
export const RiseOutlined = /*#__PURE__*/ decorative(AntRiseOutlined);
export const SearchOutlined = /*#__PURE__*/ decorative(AntSearchOutlined);
export const SmileOutlined = /*#__PURE__*/ decorative(AntSmileOutlined);
export const StopOutlined = /*#__PURE__*/ decorative(AntStopOutlined);
export const SunOutlined = /*#__PURE__*/ decorative(AntSunOutlined);
export const SwapOutlined = /*#__PURE__*/ decorative(AntSwapOutlined);
export const TableOutlined = /*#__PURE__*/ decorative(AntTableOutlined);
export const ThunderboltOutlined = /*#__PURE__*/ decorative(AntThunderboltOutlined);
export const UserOutlined = /*#__PURE__*/ decorative(AntUserOutlined);
export const WarningOutlined = /*#__PURE__*/ decorative(AntWarningOutlined);
