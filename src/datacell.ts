
import assert from 'assert';

// Dataflow cell

let updaterIdCount = 0;

export class CellUpdater {
  dirty: boolean;
  dependents: Record<number, WeakRef<CellUpdater>>;
  refreshFn: () => void;
  id: number;

  constructor(refresh: () => void) {
    this.dirty = false;
    this.dependents = {};
    this.refreshFn = refresh;
    this.id = updaterIdCount++;
  }

  valueChanged() {
    // console.log('valueChanged', this.id, this.dirty);
    if (!this.dirty) {
      this.dirty = true;
      let newDeps: Record<number, WeakRef<CellUpdater>> = {};
      for (const depId in this.dependents) {
        const dep = this.dependents[depId].deref();
        if (dep) {
          dep.valueChanged();
          newDeps[dep.id] = new WeakRef(dep);
        }
      }
      this.dependents = newDeps;
    }
  }

  addDependent(dep: CellUpdater): void {
    this.dependents[dep.id] = new WeakRef(dep);
  }

  removeDependent(dep: CellUpdater): void {
    delete this.dependents[dep.id];
  }

  refresh(): void {
    if (this.dirty) {
      this.refreshFn();
      this.dirty = false;
    }
  }

}

export interface DataCell<T> {

  getUpdater(): CellUpdater;

  getValue(): T;

}

export class MutableCell<T> implements DataCell<T> {
  updater: CellUpdater;
  value: T;

  constructor(value: T) {
    this.value = value;
    this.updater = new CellUpdater(() => {});
  }

  getValue(): T {
    this.updater.refresh();
    return this.value;
  }

  setValue(value: T) {
    this.value = value;
    this.updater.valueChanged();
  }

  getUpdater(): CellUpdater {
    return this.updater;
  }
}

export interface DependencyTracker {
  addDependency(updater: CellUpdater): void;
}

export function getCellValue<T>(tracker: DependencyTracker, cell: DataCell<T>): T {
  tracker.addDependency(cell.getUpdater());
  return cell.getValue();
}

class RecordDependencyTracker implements DependencyTracker {
  deps: Record<number, CellUpdater>;

  constructor() {
    this.deps = {};
  }

  addDependency(updater: CellUpdater) {
    this.deps[updater.id] = updater;
  }

}

export class FunctionalCell<T> implements DataCell<T> {
  updater: CellUpdater;
  value: T;
  updateFn: (tracker: DependencyTracker) => T;
  dependencies: Record<number, CellUpdater>;

  constructor(updateFn: (tracker: DependencyTracker) => T) {
    this.updateFn = updateFn;

    this.dependencies = [];

    this.updater = new CellUpdater(() => {
      this.refresh();
    });

    this.value = undefined as T;

    this.refresh();
  }

  refresh() {
    let tracker = new RecordDependencyTracker();
    this.value = this.updateFn(tracker);

    for (let depId in tracker.deps) {
      if (!(depId in this.dependencies)) {
        tracker.deps[depId].addDependent(this.updater);
        // console.log('addDependent', depId, this.updater.id);
      }
    }

    for (let depId in this.dependencies) {
      if (!(depId in tracker.deps)) {
        this.dependencies[depId].removeDependent(this.updater);
        // console.log('removeDependent', depId, this.updater.id);
      }
    }

    this.dependencies = tracker.deps;
  }

  getValue(): T {
    this.updater.refresh();
    return this.value;
  }

  getUpdater(): CellUpdater {
    return this.updater;
  }
}

export function runTest() {
  let x = new MutableCell(2);
  let y = new MutableCell(3);
  assert.equal(2, x.getValue());
  assert.equal(3, y.getValue());
  let xpy = new FunctionalCell((tr) => getCellValue(tr, x) + getCellValue(tr, y));
  assert.equal(5, xpy.getValue());
  x.setValue(40);
  assert.equal(43, xpy.getValue());
  y.setValue(6);
  assert.equal(46, xpy.getValue());
  let xpyt2 = new FunctionalCell((tr) => getCellValue(tr, xpy) * 2);
  assert.equal(92, xpyt2.getValue());
  x.setValue(1);
  assert.equal(14, xpyt2.getValue());
}
