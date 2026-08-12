import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, User, Phone, MapPin, Droplets, Calendar } from 'lucide-react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { Card, FadeIn } from '@/components/UI';
import { colors, fonts, radius, spacing } from '@/lib/theme';
import { endpoints } from '@/lib/api';

export default function AddPatient() {
  const [form, setForm] = React.useState({
    name: '', age: '', gender: 'Male' as 'Male' | 'Female',
    blood: '', mobile: '', address: '',
  });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.mobile || !form.age) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const data = {
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        blood: form.blood,
        mobile: form.mobile,
        address: form.address,
      };

      await endpoints.patients.create(data);
      alert('Patient record saved successfully!');
      router.back();
    } catch (e: any) {
      console.error('Add patient error:', e);
      alert(e.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  const Input = ({ label, icon: Icon, value, onChange, ...props }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Icon size={16} color={colors.mutedForeground} />
        <TextInput 
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholderTextColor={colors.mutedForeground}
          {...props}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader 
        title="Add New Patient" 
        left={<ChevronLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrap}>
                <User size={16} color={colors.mutedForeground} />
                <TextInput 
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t) => setForm(f => ({ ...f, name: t }))}
                  placeholder="Enter patient's full name"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age</Text>
                  <View style={styles.inputWrap}>
                    <Calendar size={16} color={colors.mutedForeground} />
                    <TextInput 
                      style={styles.input}
                      value={form.age}
                      onChangeText={(t) => setForm(f => ({ ...f, age: t }))}
                      placeholder="e.g. 25"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderWrap}>
                  {(['Male', 'Female'] as const).map(g => (
                    <Pressable 
                      key={g}
                      style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                      onPress={() => setForm(f => ({ ...f, gender: g }))}
                    >
                      <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrap}>
                <Phone size={16} color={colors.mutedForeground} />
                <TextInput 
                  style={styles.input}
                  value={form.mobile}
                  onChangeText={(t) => setForm(f => ({ ...f, mobile: t }))}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <View style={styles.inputWrap}>
                <Droplets size={16} color={colors.mutedForeground} />
                <TextInput 
                  style={styles.input}
                  value={form.blood}
                  onChangeText={(t) => setForm(f => ({ ...f, blood: t }))}
                  placeholder="e.g. O+, AB-"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address (Optional)</Text>
              <View style={styles.inputWrap}>
                <MapPin size={16} color={colors.mutedForeground} />
                <TextInput 
                  style={styles.input}
                  value={form.address}
                  onChangeText={(t) => setForm(f => ({ ...f, address: t }))}
                  placeholder="Current residence address"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                />
              </View>
            </View>

            <Pressable 
              style={[styles.submitBtn, loading && styles.btnDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Patient Record</Text>
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
  body: { paddingHorizontal: 4, paddingBottom: 40, paddingTop: 15 },
  formCard: { padding: 15, borderRadius: 12, elevation: 2 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontFamily: fonts.semibold, color: colors.foreground, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { flex: 1, height: '100%', marginLeft: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.foreground },
  row: { flexDirection: 'row' },
  genderWrap: { flexDirection: 'row', height: 48, gap: 8 },
  genderBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  genderBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.mutedForeground },
  genderTextActive: { color: '#FFFFFF' },
  submitBtn: { height: 48, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});
