/**
 * Composition root: the only place where data implementations meet domain use cases.
 * Presentation imports the wired use cases from here. See docs/clean-architecture.md.
 */
import { expoUpdateRepository } from '@/features/updates/data/expo-update-repository';
import { makeGetBuildInfo } from '@/features/updates/domain/get-build-info';

export const getBuildInfo = makeGetBuildInfo(expoUpdateRepository);
