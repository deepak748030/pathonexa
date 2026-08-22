import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlueHeader, SegTabs } from '../components/kit';
import { CrudModuleBody } from '../components/CrudModuleScreen';
import { packageConfig, testConfig } from '../src/moreModules';
import { C } from '../src/theme';

export default function TestsPackagesScreen() {
  const router = useRouter();
  const [tab, setTab] = React.useState(0);
  return (
    <View style={styles.screen}>
      <BlueHeader title="Tests & Packages" sub="Manage your lab catalogue" onBack={() => router.back()} />
      {tab === 0
        ? <CrudModuleBody key="tests" config={testConfig} header={<SegTabs tabs={['Tests', 'Packages']} active={tab} onChange={setTab} />} />
        : <CrudModuleBody key="packages" config={packageConfig} header={<SegTabs tabs={['Tests', 'Packages']} active={tab} onChange={setTab} />} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
});
