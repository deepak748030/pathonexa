import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import CrudModuleScreen from '../../components/CrudModuleScreen';
import { moreModuleConfigs } from '../../src/moreModules';

export default function ManageModuleRoute() {
  const params = useLocalSearchParams<{ module?: string | string[] }>();
  const moduleKey = Array.isArray(params.module) ? params.module[0] : params.module;
  const config = moduleKey ? moreModuleConfigs[moduleKey] : undefined;
  if (!config) return <Redirect href="/(tabs)/more" />;
  return <CrudModuleScreen config={config} />;
}
