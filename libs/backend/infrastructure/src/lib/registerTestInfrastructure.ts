import { inject, register } from '@shared/di-container';

import { tokenAIService, tokenFakeAIService } from './AIService';
import {
  tokenAssessmentsRepository,
  tokenFakeAssessmentsRepository,
} from './AssessmentsRepository';
import {
  tokenAssessmentsStateMachine,
  tokenFakeAssessmentsStateMachine,
  tokenStateMachineArn,
} from './AssessmentsStateMachine';
import {
  testDynamoDbConfig,
  tokenDynamoDBConfig,
} from './config/dynamodb/config';
import {
  tokenFakeFindingToBestPracticesAssociationService,
  tokenFindingToBestPracticesAssociationService,
  tokenPromptArn,
} from './FindingToBestPracticesAssociationService';
import { FakeIdGenerator, tokenIdGenerator } from './IdGenerator';
import { FakeLogger, tokenLogger } from './Logger';
import {
  tokenFakeMarketplaceService,
  tokenMarketplaceService,
} from './MarketplaceService';
import {
  tokenFakeObjectsStorage,
  tokenObjectsStorage,
  tokenS3Bucket,
} from './ObjectsStorage';
import {
  tokenFakeOrganizationRepository,
  tokenOrganizationRepository,
} from './OrganizationRepository';
import {
  tokenFakeQuestionSetService,
  tokenQuestionSetService,
} from './QuestionSetService';
import {
  tokenFakeWellArchitectedToolService,
  tokenWellArchitectedToolService,
} from './WellArchitectedToolService';

export const registerTestInfrastructure = () => {
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });
  register(tokenDynamoDBConfig, { useValue: testDynamoDbConfig });
  register(tokenStateMachineArn, { useValue: 'arn:test-state-machine-arn' });
  register(tokenS3Bucket, { useValue: 'test-s3-bucket' });
  register(tokenPromptArn, { useValue: 'arn:test-prompt-arn' });
  register(tokenAssessmentsStateMachine, {
    useFactory: () => inject(tokenFakeAssessmentsStateMachine),
  });
  register(tokenAssessmentsRepository, {
    useFactory: () => inject(tokenFakeAssessmentsRepository),
  });
  register(tokenAIService, {
    useFactory: () => inject(tokenFakeAIService),
  });
  register(tokenQuestionSetService, {
    useFactory: () => inject(tokenFakeQuestionSetService),
  });
  register(tokenObjectsStorage, {
    useFactory: () => inject(tokenFakeObjectsStorage),
  });
  register(tokenWellArchitectedToolService, {
    useFactory: () => inject(tokenFakeWellArchitectedToolService),
  });
  register(tokenOrganizationRepository, {
    useFactory: () => inject(tokenFakeOrganizationRepository),
  });
  register(tokenMarketplaceService, {
    useFactory: () => inject(tokenFakeMarketplaceService),
  });
  register(tokenFindingToBestPracticesAssociationService, {
    useFactory: () => inject(tokenFakeFindingToBestPracticesAssociationService),
  });
};
