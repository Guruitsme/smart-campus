import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, options = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...options,
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

export function getAttendanceColor(percentage) {
  if (percentage >= 85) return 'text-emerald-600';
  if (percentage >= 75) return 'text-amber-500';
  return 'text-red-500';
}

export function getAttendanceBg(percentage) {
  if (percentage >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (percentage >= 75) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

export function getPriorityBadge(priority) {
  const map = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high:   'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low:    'bg-gray-100 text-gray-600 border-gray-200',
  };
  return map[priority] || map.medium;
}

export function getCategoryIcon(category) {
  const map = {
    exam:       '📝',
    event:      '🎉',
    holiday:    '🌴',
    assignment: '📚',
    result:     '🏆',
    placement:  '💼',
    general:    '📢',
    other:      '📌',
  };
  return map[category] || '📌';
}

export function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileType) {
  const map = {
    pdf:  '📄',
    ppt:  '📊',
    pptx: '📊',
    doc:  '📝',
    docx: '📝',
    zip:  '📦',
  };
  return map[fileType?.toLowerCase()] || '📁';
}

export function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getDayName(day) {
  const days = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
  return days[day] || day;
}

export const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Biotechnology', 'MBA', 'MCA',
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const EXAM_TYPES = ['IA1', 'IA2', 'IA3', 'Assignment', 'Lab', 'Quiz', 'Project'];
