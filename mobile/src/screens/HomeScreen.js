import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { studentService, attendanceService, assignmentService, announcementService } from '../services/api';
import useAuthStore from '../store/authStore';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const { data: dashData, isLoading: dashLoading, refetch } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => studentService.getDashboard(),
    enabled: user?.role === 'student',
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['mobile-attendance'],
    queryFn: () => attendanceService.getMyAttendance(),
    enabled: user?.role === 'student',
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['mobile-announcements'],
    queryFn: () => announcementService.getAnnouncements({ limit: 4 }),
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const dash = dashData?.data?.data;
  const attendance = attendanceData?.data?.data || [];
  const announcements = announcementsData?.data?.data || [];
  const overallAttendance = dash?.overallAttendance || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userMeta}>{user?.department} · Sem {user?.semester}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Alert */}
        {overallAttendance > 0 && overallAttendance < 75 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Low Attendance Warning</Text>
              <Text style={styles.alertText}>Your attendance is {overallAttendance}% — below 75%</Text>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        {dashLoading ? (
          <ActivityIndicator color="#6366f1" style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Attendance" value={`${overallAttendance}%`} color="#6366f1" emoji="📅" />
            <StatCard label="Pending" value={dash?.pendingAssignments || 0} color="#f59e0b" emoji="📝" />
            <StatCard label="Unread" value={dash?.unreadNotifications || 0} color="#10b981" emoji="🔔" />
            <StatCard label="Subjects" value={attendance.length} color="#f43f5e" emoji="📚" />
          </View>
        )}

        {/* Attendance Summary */}
        {attendance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject Attendance</Text>
            {attendance.map((a, i) => (
              <View key={i} style={styles.attendanceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{a.subject?.code}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${a.percentage}%`, backgroundColor: a.percentage >= 75 ? '#6366f1' : '#ef4444' }]} />
                  </View>
                </View>
                <Text style={[styles.attendancePct, { color: a.percentage >= 75 ? '#10b981' : '#ef4444' }]}>
                  {a.percentage}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.length === 0 ? (
            <Text style={styles.emptyText}>No announcements</Text>
          ) : (
            announcements.map((a) => (
              <TouchableOpacity
                key={a._id}
                style={[styles.announcementCard, a.priority === 'urgent' && styles.urgentCard]}
                onPress={() => navigation.navigate('Announcements')}
              >
                <Text style={styles.announcementTitle}>{a.title}</Text>
                <Text style={styles.announcementContent} numberOfLines={2}>{a.content}</Text>
                <View style={styles.announcementMeta}>
                  <Text style={styles.metaText}>{a.category}</Text>
                  {a.priority === 'urgent' && <Text style={styles.urgentBadge}>URGENT</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: 'Notes', emoji: '📄', screen: 'Notes', color: '#eff6ff' },
              { label: 'Assignments', emoji: '📝', screen: 'Assignments', color: '#f5f3ff' },
              { label: 'Marks', emoji: '📊', screen: 'Marks', color: '#ecfdf5' },
              { label: 'Timetable', emoji: '🗓', screen: 'Timetable', color: '#fff7ed' },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={[styles.actionBtn, { backgroundColor: a.color }]} onPress={() => navigation.navigate(a.screen)}>
                <Text style={styles.actionEmoji}>{a.emoji}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, emoji }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  greeting: { fontSize: 13, color: '#64748b' },
  userName: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  userMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10 },
  logoutText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  alertBox: { margin: 16, padding: 14, backgroundColor: '#fef2f2', borderRadius: 14, borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertIcon: { fontSize: 20 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  alertText: { fontSize: 12, color: '#b91c1c', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  section: { padding: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  subjectName: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  attendancePct: { fontSize: 15, fontWeight: '700', minWidth: 42, textAlign: 'right' },
  announcementCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  urgentCard: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  announcementTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  announcementContent: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  announcementMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  metaText: { fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' },
  urgentBadge: { fontSize: 10, fontWeight: '700', color: '#ef4444', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: '44%', borderRadius: 14, padding: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
});
