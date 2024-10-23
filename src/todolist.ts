import * as vscode from 'vscode';
import * as path from 'path';
const Fuse = require('fuse.js');
class TODOTree implements vscode.TreeDataProvider<DataItem> {
    data : DataItem[];
    result : DataItem[];
    cnt:number;
    constructor() {
        this.data = [];
        this.result = [];
        this.cnt = 0;
    }
    async save(context: vscode.ExtensionContext):Promise<void> {
        await context.globalState.update('listdata',this.data);
        await context.globalState.update('listresult',this.result);
    }
    init(context: vscode.ExtensionContext):void {
        if(context.globalState.get('listdata')) {
            this.data = context.globalState.get('listdata') as DataItem[];
        }
        if(context.globalState.get('listresult')) {
            this.result = context.globalState.get('listresult') as DataItem[];
        }
    }
    delTODO(node:DataItem):void {
        const index = this.data.indexOf(node);
        const ind = this.result.indexOf(node);
        if(index !== -1) {
            this.data.splice(index,1);
        }
        if(ind !== -1) {
            this.result.splice(ind,1);
        }
    }
    findTODO(key:string):void {
        const fuse = new Fuse(this.data,{
            keys:['title'],
            shouldSort: true,
            threshold: 0.6,
            sortFn: (a:DataItem,b:DataItem) => {
                return a.cnt < b.cnt;
            }
        });
        let res = fuse.search(key);
        this.result.splice(0,this.result.length);
        res.forEach((ele:{item:DataItem,refIndex:number}) => {
            this.result.push(ele.item);
        });
        let tmp:DataItem[];
        tmp = this.data;
        this.data = this.result;
        this.result = tmp;
    }
    clearFilter():void {
        this.data.splice(0,this.data.length);
        this.result.forEach((ele:DataItem) => {
            this.data.push(ele);
        });
        this.result.splice(0,this.result.length);
    }
    addTODO(label:string,status:string):void {
        let item:DataItem = new DataItem(label,status,this.cnt);
        this.cnt++;
        this.data.push(item);
    }
    getTreeItem(element: DataItem): DataItem | Thenable<DataItem> {
        return element;
    }
    getChildren(element?: DataItem | undefined): vscode.ProviderResult<DataItem[]> {
        return this.data;
    }
    refresh():void {
        this._onDidChangeTreeData.fire(null);
    }
    private _onDidChangeTreeData: vscode.EventEmitter<DataItem | null> = new vscode.EventEmitter<DataItem | null>();
    readonly onDidChangeTreeData: vscode.Event<DataItem | null> = this._onDidChangeTreeData.event;
}
class DataItem extends vscode.TreeItem {
    public title:string;
    public cnt:number;
    constructor(label:string,status:string,id:number) {
        super(`${status} - ${label}`,vscode.TreeItemCollapsibleState.None);
        this.cnt = id;
        this.iconPath = {
            light: path.join(__dirname,'..','image',`todo.svg`),
            dark: path.join(__dirname,'..','image',`todo_light.svg`)
        };
        this.tooltip = this.label as string;
        this.title = `${label}`;
    }
}
export {
    TODOTree,
    DataItem
};