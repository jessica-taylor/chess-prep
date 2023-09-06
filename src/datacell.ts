
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

export class MutableCell<T> {
  updater: CellUpdater;
  value: T;

  constructor(value: T) {
    this.value = value;
    this.updater = new CellUpdater(() => {});
  }

  getValue(): T {
    return this.value;
  }

  setValue(value: T) {
    this.value = value;
    this.updater.valueChanged();
  }
}

export interface DependencyTracker {
  addDependency(updater: CellUpdater): void;
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

export class FunctionalCell<T> {
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
      }
    }

    for (let depId in this.dependencies) {
      if (!(depId in tracker.deps)) {
        this.dependencies[depId].removeDependent(this.updater);
      }
    }

    this.dependencies = tracker.deps;
  }

  getValue(): T {
    this.updater.refresh();
    return this.value;
  }

  // getUpdater(): CellUpdater {
  //   return this.updater;
  // }
}


