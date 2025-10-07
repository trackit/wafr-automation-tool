import { FindingResource } from './Finding';

export class FindingResourceMother {
  private data: FindingResource;

  private constructor(data: FindingResource) {
    this.data = data;
  }

  public static basic(): FindingResourceMother {
    return new FindingResourceMother({
      uid: 'resource-uid',
      region: 'us-east-1',
      name: 'resource-name',
      type: 'resource-type',
    });
  }

  public withUid(uid: string | undefined): FindingResourceMother {
    this.data.uid = uid;
    return this;
  }

  public withRegion(region: string | undefined): FindingResourceMother {
    this.data.region = region;
    return this;
  }

  public withName(name: string | undefined): FindingResourceMother {
    this.data.name = name;
    return this;
  }

  public withType(type: string | undefined): FindingResourceMother {
    this.data.type = type;
    return this;
  }

  public build(): FindingResource {
    return this.data;
  }
}
