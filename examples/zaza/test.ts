export class MetaRoot {
        static readonly metaclass: MetaRoot = new MetaRoot(null);

        readonly superClass: MetaRoot | null;
        readonly typeName: string;

        protected constructor(superClass: MetaRoot | null, typeName = 'TMetaRoot') {
                this.superClass = superClass;
                this.typeName = typeName;
        }
        getMetaclass(): MetaRoot {
                return MetaRoot.metaclass;
        }
}

export class MetaTestA extends MetaRoot {
        static readonly metaclass: MetaTestA = new MetaTestA(MetaRoot.metaclass);

        protected constructor(superClass: MetaRoot) {
                super(superClass, 'TestA');
        }
        getMetaclass(): MetaTestA {
                return MetaTestA.metaclass;
        }
}

export class MetaTestB extends MetaTestA {
        static readonly metaclass: MetaTestB = new MetaTestB(MetaTestA.metaclass);

        protected constructor(superClass: MetaTestA) {
                super(superClass);
                // et vous changez juste le nom :
                (this as any).typeName = 'TestB';
        }
        getMetaclass(): MetaTestB {
                return MetaTestB.metaclass;
        }
}

export class MetaTestC extends MetaTestB {
        static readonly metaclass: MetaTestC = new MetaTestC(MetaTestB.metaclass);

        protected constructor(superClass: MetaTestB) {
                super(superClass);
                (this as any).typeName = 'TestC';
        }

        getMetaclass(): MetaTestC {
                return MetaTestC.metaclass;
        }
}

export function test() {
        let c: MetaRoot | null = MetaTestC.metaclass;
        while (c) {
                console.log(`${c.getMetaclass().typeName} - ${c.typeName} -> ${c.superClass?.typeName}`);
                c = c.superClass;
        }
}
