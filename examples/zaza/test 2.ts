export class MetaRoot {
        //static readonly metaclass = new MetaRoot(); // Not static
        static metaclass: MetaRoot = new MetaRoot(null);
        superClass: MetaRoot | null = null;
        readonly typeName: string = 'TMetaRoot';
        protected constructor(superclass: MetaRoot | null) {
                this.superClass = superclass;
        }
        getMetaclass(): MetaRoot {
                return MetaRoot.metaclass;
        }
}

export class MetaTestA extends MetaRoot {
        readonly typeName: string = 'TestA';

        // Link to the parent metaclass singleton (null for the root).
        static metaclass: MetaRoot = new MetaTestA(MetaRoot.metaclass);
        getMetaclass(): MetaRoot {
                return MetaTestA.metaclass;
        }

        protected constructor(superclass: MetaRoot | null) {
                super(MetaTestA.metaclass);
                this.superClass = superclass;
        }
}

export class MetaTestB extends MetaTestA {
        //static readonly metaclass(sup : TMetaRoot) = new MetaTestB(sup);
        readonly typeName: string = 'TestB';
        static metaclass = new MetaTestB(MetaTestA.metaclass);

        protected constructor(superclass: MetaRoot | null) {
                super(MetaTestB.metaclass);
                this.superClass = superclass;
        }
        getMetaclass(): MetaRoot {
                return MetaTestB.metaclass;
        }
}

export class MetaTestC extends MetaTestB {
        readonly typeName: string = 'TestC';
        static metaclass = new MetaTestC(MetaTestB.metaclass);
        constructor(superclass: MetaRoot) {
                super(MetaTestC.metaclass);
                this.superClass = superclass; // ✅ parent singleton
        }
        getMetaclass(): MetaRoot {
                return MetaTestC.metaclass;
        }
}

export function test() {
        let c: MetaRoot | null = MetaTestC.metaclass;
        while (c != null) {
                console.log(`${c.typeName} -> ${c.superClass?.typeName}`);
                c = c.superClass;
        }
}
