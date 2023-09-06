
// Dataflow cell


export class CellUpdater {
  dirty: boolean;
  dependents: WeakRef<CellUpdater>[];
  refreshFn: () => void;

  constructor(refresh: () => void) {
    this.dirty = false;
    this.dependents = [];
    this.refreshFn = refresh;
  }

  valueChanged() {
    if (!this.dirty) {
      this.dirty = true;
      let newDeps = [];
      for (let depRef of this.dependents) {
        const dep = depRef.deref();
        if (dep) {
          dep.valueChanged();
          newDeps.push(new WeakRef(dep));
        }
      }
      this.dependents = newDeps;
    }
  }

  addDependent(dep: CellUpdater): void {
    this.dependents.push(new WeakRef(dep));
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

export class FunctionalCell<T> {
  updater: CellUpdater;
  value: T;
  updateFn: () => T;

  constructor(updateFn: () => T, dependencies: CellUpdater[]) {
    this.value = updateFn();

    this.updateFn = updateFn;

    this.updater = new CellUpdater(() => {
      this.value = updateFn();
    });

    for (let dep of dependencies) {
      dep.addDependent(this.updater);
    }
  }

  getValue(): T {
    this.updater.refresh();
    return this.value;
  }

  // getUpdater(): CellUpdater {
  //   return this.updater;
  // }
}


