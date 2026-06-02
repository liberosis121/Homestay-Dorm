import { 
  UserCog, Calendar, CreditCard, FileText, Activity 
} from 'lucide-react';
import { Customer } from './CustomerProfileCard';

interface CustomerTimelineProps {
  activities: Customer['recentActivities'];
}

export default function CustomerTimeline({ activities }: CustomerTimelineProps) {
  // Bản đồ icon dựa trên chuỗi tên
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'edit':
        return <UserCog className="w-3.5 h-3.5 text-white" />;
      case 'calendar_month':
      case 'calendar':
        return <Calendar className="w-3.5 h-3.5 text-white" />;
      case 'payments':
      case 'wallet':
        return <CreditCard className="w-3.5 h-3.5 text-white" />;
      case 'contract':
      case 'file':
        return <FileText className="w-3.5 h-3.5 text-white" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-white" />;
    }
  };

  // Bản đồ màu sắc nền dựa trên chuỗi tên
  const getBgClass = (iconBg: string) => {
    switch (iconBg) {
      case 'bg-primary':
        return 'bg-[#6f583c]';
      case 'bg-tertiary':
        return 'bg-[#4d614b]';
      case 'bg-primary-container':
        return 'bg-[#897052]';
      default:
        return 'bg-[#6f583c]';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-[#7f756b]">
        Không có lịch sử hoạt động nào gần đây.
      </div>
    );
  }

  return (
    <div className="relative space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#eee7e1]">
      {activities.map((activity, index) => (
        <div key={index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
          {/* Icon node */}
          <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-sm ${getBgClass(activity.iconBg)}`}>
            {getIcon(activity.icon)}
          </div>
          {/* Content */}
          <p className="text-[10px] text-[#7f756b] font-bold tracking-wider mb-0.5">{activity.time}</p>
          <p className="text-sm font-semibold text-[#1e1b17] leading-tight">{activity.title}</p>
        </div>
      ))}
    </div>
  );
}
