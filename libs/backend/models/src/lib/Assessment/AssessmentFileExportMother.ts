import {
  AssessmentFileExport,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
} from './Assessment';

export class AssessmentFileExportMother {
  private data: AssessmentFileExport;

  private constructor(data: AssessmentFileExport) {
    this.data = data;
  }

  public static basic(): AssessmentFileExportMother {
    return new AssessmentFileExportMother({
      id: 'file-export-id',
      type: AssessmentFileExportType.PDF,
      status: AssessmentFileExportStatus.NOT_STARTED,
      versionName: 'version-name',
      createdAt: new Date(),
      error: undefined,
      objectKey: undefined,
    });
  }

  public withId(id: string): AssessmentFileExportMother {
    this.data.id = id;
    return this;
  }

  public withStatus(
    status: AssessmentFileExportStatus
  ): AssessmentFileExportMother {
    this.data.status = status;
    return this;
  }

  public withVersionName(versionName: string): AssessmentFileExportMother {
    this.data.versionName = versionName;
    return this;
  }

  public withObjectKey(objectKey: string): AssessmentFileExportMother {
    this.data.objectKey = objectKey;
    return this;
  }

  public withCreatedAt(createdAt: Date): AssessmentFileExportMother {
    this.data.createdAt = createdAt;
    return this;
  }

  public withType(type: AssessmentFileExportType): AssessmentFileExportMother {
    this.data.type = type;
    return this;
  }

  public build(): AssessmentFileExport {
    return this.data;
  }
}
