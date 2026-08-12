import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Search, User, FlaskConical, Stethoscope, CreditCard, ChevronDown } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, FadeIn, SectionTitle } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { tests as localTests, doctors as localDoctors, patients as localPatients } from '@/lib/labData';
import { endpoints } from '@/lib/api';

export default function CreateReport() {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    patientId: '', testId: '', doctorId: '', amount: '', paid: false
  });
  
  const [patients, setPatients] = React.useState(localPatients);
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchPatients() {
      try {
        const data = await endpoints.patients.getAll();
        if (data && data.length > 0) setPatients(data);
      } catch (e) {}
    }
    fetchPatients();
  }, []);

  const handleSubmit = async () => {
    if (!form.patientId || !form.testId) return;
    setLoading(true);
    try {
      const reportId = 'RP' + Date.now().toString().slice(-8);
      const test = localTests.find(t => t.id === form.testId);
      const doctor = localDoctors.find(d => d.id === form.doctorId);
      
      await endpoints.reports.create({
        reportId,
        patient: form.patientId,
        test: test?.name || 'Unknown Test',
        doctor: doctor?.name || 'Direct',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        amount: parseInt(form.amount) || test?.price || 0,
        paid: form.paid,
        status: 'Pending',
        color: selectedPatient?.color || '#DBEAFE'
      });
      router.back();
    } catch (e) {
      alert('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const SelectBox = ({ label, icon: Icon, placeholder, value, onPress }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.inputWrap} onPress={onPress}>
        <Icon size={16} color={colors.mutedForeground} />
        <Text style={[styles.inputText, !value && { color: colors.mutedForeground }]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader 
        title="Create Report" 
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Card style={styles.formCard}>
            <SelectBox 
              label="Select Patient" 
              icon={User} 
              placeholder="Search or select patient"
              value={selectedPatient?.name}
              onPress={() => {
                // For demo, just pick first one if none selected
                if (!selectedPatient) {
                  const p = patients[0];
                  setSelectedPatient(p);
                  setForm(f => ({ ...f, patientId: p.id || p._id }));
                }
              }}
            />

            <SelectBox 
              label="Investigation / Test" 
              icon={FlaskConical} 
              placeholder="Select test name"
              value={localTests.find(t => t.id === form.testId)?.name}
              onPress={() => {
                const t = localTests[0];
                setForm(f => ({ ...f, testId: t.id, amount: t.price.toString() }));
              }}
            />

            <SelectBox 
              label="Referring Doctor" 
              icon={Stethoscope} 
              placeholder="Select doctor or 'Direct'"
              value={localDoctors.find(d => d.id === form.doctorId)?.name}
              onPress={() => {
                const d = localDoctors[0];
                setForm(f => ({ ...f, doctorId: d.id }));
              }}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Test Amount (₹)</Text>
              <View style={styles.inputWrap}>
                <CreditCard size={16} color={colors.mutedForeground} />
                <TextInput 
                  style={styles.input}
                  value={form.amount}
                  onChangeText={(t) => setForm(f => ({ ...f, amount: t }))}
                  placeholder="0.00"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.paymentToggle}>
              <Text style={styles.label}>Mark as Paid</Text>
              <Pressable 
                style={[styles.toggle, form.paid && styles.toggleActive]}
                onPress={() => setForm(f => ({ ...f, paid: !f.paid }))}
              >
                <View style={[styles.toggleDot, form.paid && styles.toggleDotActive]} />
              </Pressable>
            </View>

            <Pressable 
              style={[styles.submitBtn, loading && styles.btnDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Generate Report ID</Text>
              )}
            </Pressable>
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.hPad, paddingBottom: 40 },
  formCard: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontFamily: fonts.semibold, color: colors.foreground, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: colors.muted, borderRadius: radius.sm, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
  inputText: { flex: 1, marginLeft: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
  input: { flex: 1, height: '100%', marginLeft: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
  paymentToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingRight: 4 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border, padding: 2 },
  toggleActive: { backgroundColor: colors.green },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleDotActive: { marginLeft: 20 },
  submitBtn: { height: 52, backgroundColor: colors.primary, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});
