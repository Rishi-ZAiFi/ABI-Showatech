import { describe, expect, it, vi } from 'vitest';
import {
  downloadWorkflowJSON,
  readWorkflowJSON,
  type WorkflowSnapshot,
} from './persistence.service';

function snapshot(name: string | null = 'My Flow'): WorkflowSnapshot {
  return {
    version: 1,
    exportedAt: Date.now(),
    workflow: name
      ? { id: 'w', name, description: '', stepIds: [], createdAt: 0, updatedAt: 0 }
      : null,
    steps: {},
    targets: {},
    annotations: {},
  };
}

function jsonFile(name: string, body: string): File {
  return { name, text: async () => body } as unknown as File;
}

function captureAnchor() {
  let anchor: HTMLAnchorElement | undefined;
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreate(tag) as HTMLElement;
    if (tag === 'a') {
      (el as HTMLAnchorElement).click = vi.fn();
      anchor = el as HTMLAnchorElement;
    }
    return el;
  });
  return () => anchor;
}

describe('downloadWorkflowJSON', () => {
  it('builds an anchor with a name-derived filename and clicks it', () => {
    const getAnchor = captureAnchor();
    downloadWorkflowJSON(snapshot('My Flow'));
    expect(getAnchor()?.click).toHaveBeenCalledTimes(1);
    expect(getAnchor()?.download).toBe('My_Flow.showatec.json');
  });

  it('falls back to "workflow" when there is no workflow name', () => {
    const getAnchor = captureAnchor();
    downloadWorkflowJSON(snapshot(null));
    expect(getAnchor()?.download).toBe('workflow.showatec.json');
  });

  it('honours an explicit filename', () => {
    const getAnchor = captureAnchor();
    downloadWorkflowJSON(snapshot('X'), 'custom.json');
    expect(getAnchor()?.download).toBe('custom.json');
  });
});

describe('readWorkflowJSON', () => {
  it('accepts a valid snapshot file', async () => {
    const result = await readWorkflowJSON(jsonFile('flow.json', JSON.stringify(snapshot('Valid'))));
    expect(result.version).toBe(1);
    expect(result.workflow?.name).toBe('Valid');
  });

  it('accepts the .showatec.json extension', async () => {
    const result = await readWorkflowJSON(
      jsonFile('flow.showatec.json', JSON.stringify(snapshot('Valid'))),
    );
    expect(result.workflow?.name).toBe('Valid');
  });

  it('rejects an unsupported file extension', async () => {
    await expect(readWorkflowJSON(jsonFile('flow.txt', '{}'))).rejects.toThrow(
      /\.json or \.showatec\.json/,
    );
  });

  it('rejects malformed JSON', async () => {
    await expect(readWorkflowJSON(jsonFile('flow.json', 'not json'))).rejects.toThrow(
      /not valid JSON/,
    );
  });

  it('rejects a non-object top level (null)', async () => {
    await expect(readWorkflowJSON(jsonFile('flow.json', 'null'))).rejects.toThrow(
      /expected a JSON object/,
    );
  });

  it('rejects an unsupported version', async () => {
    const bad = JSON.stringify({ ...snapshot(), version: 2 });
    await expect(readWorkflowJSON(jsonFile('flow.json', bad))).rejects.toThrow(
      /Unsupported workflow file version: 2/,
    );
  });

  it('rejects a file missing the "workflow" field', async () => {
    const bad = JSON.stringify({ version: 1, steps: {}, targets: {}, annotations: {} });
    await expect(readWorkflowJSON(jsonFile('flow.json', bad))).rejects.toThrow(
      /missing "workflow" field/,
    );
  });

  it('rejects when steps is an array rather than a map', async () => {
    const bad = JSON.stringify({ version: 1, workflow: null, steps: [], targets: {}, annotations: {} });
    await expect(readWorkflowJSON(jsonFile('flow.json', bad))).rejects.toThrow(
      /"steps" must be an object map/,
    );
  });

  it('rejects when annotations is missing/invalid', async () => {
    const bad = JSON.stringify({ version: 1, workflow: null, steps: {}, targets: {}, annotations: null });
    await expect(readWorkflowJSON(jsonFile('flow.json', bad))).rejects.toThrow(
      /"annotations" must be an object map/,
    );
  });
});
