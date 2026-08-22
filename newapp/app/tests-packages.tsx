import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlueHeader, SegTabs } from '../components/kit';
import { CrudModuleBody } from '../components/CrudModuleScreen';
import { packageConfig, testConfig } from '../src/moreModules';
import { C, PAGE_GUTTER } from '../src/theme';

export default function TestsPackagesScreen() {
  const router = useRouter();
  const [tab, setTab] = React.useState(0);
  return (
    <View style={styles.screen}>
      <BlueHeader title="Tests & Packages" sub="Manage your lab catalogue" onBack={() => router.back()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SegTabs tabs={['Tests', 'Packages']} active={tab} onChange={setTab} />
        <View style={styles.section}>
          {tab === 0
            ? <CrudModuleBody key="tests" config={testConfig} />
            : <CrudModuleBody key="packages" config={packageConfig} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 28 },
  section: { marginTop: 4 },
});
