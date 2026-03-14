import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import useAuthStore from '../store/authStore';

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:   { email: 'admin@campus.edu',   password: 'Admin@1234' },
      faculty: { email: 'faculty@campus.edu', password: 'Faculty@123' },
      student: { email: 'student@campus.edu', password: 'Student@123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.title}>Smart Campus</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@campus.edu"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo Login */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Quick Demo Login</Text>
            <View style={styles.demoRow}>
              {['admin', 'faculty', 'student'].map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => fillDemo(role)}
                  style={[styles.demoBtn, demoColors[role]]}
                >
                  <Text style={[styles.demoBtnText, demoBtnTextColors[role]]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const demoColors = {
  admin:   { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  faculty: { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' },
  student: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
};
const demoBtnTextColors = {
  admin:   { color: '#dc2626' },
  faculty: { color: '#7c3aed' },
  student: { color: '#2563eb' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 6 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#0f172a', marginBottom: 4 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn: { padding: 13, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12 },
  loginBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  demoSection: { alignItems: 'center' },
  demoTitle: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  demoBtnText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
});
