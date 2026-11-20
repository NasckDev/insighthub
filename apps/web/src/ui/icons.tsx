import type { ComponentType } from 'react';
import {
  ApartmentOutlined as AntApartmentOutlined,
  ApiOutlined as AntApiOutlined,
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

export const ApartmentOutlined = decorative(AntApartmentOutlined);
export const ApiOutlined = decorative(AntApiOutlined);
export const ArrowLeftOutlined = decorative(AntArrowLeftOutlined);
export const ArrowRightOutlined = decorative(AntArrowRightOutlined);
export const BarChartOutlined = decorative(AntBarChartOutlined);
export const BulbOutlined = decorative(AntBulbOutlined);
export const CheckCircleFilled = decorative(AntCheckCircleFilled);
export const CheckOutlined = decorative(AntCheckOutlined);
export const CloseCircleFilled = decorative(AntCloseCircleFilled);
export const CloseOutlined = decorative(AntCloseOutlined);
export const CompassOutlined = decorative(AntCompassOutlined);
export const CopyOutlined = decorative(AntCopyOutlined);
export const DashboardOutlined = decorative(AntDashboardOutlined);
export const DeleteOutlined = decorative(AntDeleteOutlined);
export const DisconnectOutlined = decorative(AntDisconnectOutlined);
export const DownloadOutlined = decorative(AntDownloadOutlined);
export const EditOutlined = decorative(AntEditOutlined);
export const ExclamationCircleFilled = decorative(AntExclamationCircleFilled);
export const FallOutlined = decorative(AntFallOutlined);
export const FileMarkdownOutlined = decorative(AntFileMarkdownOutlined);
export const FilterOutlined = decorative(AntFilterOutlined);
export const FrownOutlined = decorative(AntFrownOutlined);
export const InfoCircleFilled = decorative(AntInfoCircleFilled);
export const KeyOutlined = decorative(AntKeyOutlined);
export const LinkOutlined = decorative(AntLinkOutlined);
export const MehOutlined = decorative(AntMehOutlined);
export const MenuOutlined = decorative(AntMenuOutlined);
export const MessageOutlined = decorative(AntMessageOutlined);
export const MoonOutlined = decorative(AntMoonOutlined);
export const PushpinOutlined = decorative(AntPushpinOutlined);
export const QuestionCircleOutlined = decorative(AntQuestionCircleOutlined);
export const ReloadOutlined = decorative(AntReloadOutlined);
export const RiseOutlined = decorative(AntRiseOutlined);
export const SearchOutlined = decorative(AntSearchOutlined);
export const SmileOutlined = decorative(AntSmileOutlined);
export const StopOutlined = decorative(AntStopOutlined);
export const SunOutlined = decorative(AntSunOutlined);
export const SwapOutlined = decorative(AntSwapOutlined);
export const TableOutlined = decorative(AntTableOutlined);
export const ThunderboltOutlined = decorative(AntThunderboltOutlined);
export const UserOutlined = decorative(AntUserOutlined);
export const WarningOutlined = decorative(AntWarningOutlined);
