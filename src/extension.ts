import * as vscode from 'vscode';
import * as path from 'path';
import { TODOTree, DataItem } from './todolist';
let key:string;
let stt:{label:string,kind?:vscode.QuickPickItemKind}[] = [
    {label:'状态',kind:vscode.QuickPickItemKind.Separator},
    {label:'TODO'},
    {label:'DOING'},
    {label:'DONE'},
    {label:'ABANDON'}];
let configure:{label:string,kind?:vscode.QuickPickItemKind}[] = [
    {label:'管理',kind:vscode.QuickPickItemKind.Separator},
    {label:'新建一个状态...'},
    {label:'删除一个状态...'}];
export function activate(context: vscode.ExtensionContext) {
    let list:TODOTree = new TODOTree();
    list.init(context);
    vscode.window.onDidChangeWindowState((e:vscode.WindowState) => {
        list.init(context);
    });
    if(context.globalState.get('status')) {
        stt = context.globalState.get('status') as {label:string,kind?:vscode.QuickPickItemKind}[];
    } else {
        context.globalState.update('status',stt);
    }
    context.subscriptions.push(vscode.commands.registerCommand('cj-note.addNewTODO',() => {
        vscode.window.showInputBox({
            password: false,
            prompt: "输入你的待办事项："
        }).then(value => {
            if(value) {
                if(!context.globalState.get('filtered')) {
                    list.addTODO(value,'TODO');
                }
                if(context.globalState.get('filtered')) {
                    list.clearFilter();
                    list.addTODO(value,'TODO');
                    list.findTODO(key);
                }
                list.refresh();
                list.save(context);
            }
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('cj-note.deleteTODO',(node:DataItem) => {
        list.delTODO(node);
        list.refresh();
        list.save(context);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('cj-note.TODOfilter',() => {
        vscode.window.showInputBox({
            password: false,
            prompt: "输入要查询的待办事项："
        }).then(value => {
            if(value) {
                key = value;
                list.findTODO(value);
                context.globalState.update('filtered',1);
                vscode.commands.executeCommand('setContext','cj-note.filtered',1);
                list.refresh();
                list.save(context);
            }
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('cj-note.clearFilter',() => {
        list.clearFilter();
        context.globalState.update('filtered',0);
        vscode.commands.executeCommand('setContext','cj-note.filtered',0);
        list.refresh();
        list.save(context);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('cj-note.changeTODO',(node:DataItem) => {
        vscode.window.showQuickPick(stt.concat(configure),{
            title:'选择一个状态',
            placeHolder:'状态...',
            canPickMany: false
        }).then((value:{label:string} | undefined) => {
            if(value) {
                if(value.label === '新建一个状态...') {
                    vscode.window.showInputBox({
                        password:false,
                        prompt:"输入新建的状态："
                    }).then(value => {
                        if(value) {
                            stt.splice(-2,0,{label:value});
                        }
                        context.globalState.update('status',stt);
                        vscode.commands.executeCommand('cj-note.changeTODO',node);
                    });
                    return;
                }
                if(value.label === '删除一个状态...') {
                    vscode.window.showQuickPick(stt,{
                        title:'选择你要删除的状态',
                        placeHolder:'状态...',
                        canPickMany: false
                    }).then(value => {
                        if(value) {
                            stt.splice(stt.indexOf(value),1);
                        }
                        context.globalState.update('status',stt);
                        vscode.commands.executeCommand('cj-note.changeTODO',node);
                    });
                    return;
                }
                if(value.label === 'TODO') {
                    node.iconPath = {
                        light: path.join(__dirname,'..','image',`todo.svg`),
                        dark: path.join(__dirname,'..','image',`todo_light.svg`)
                    };
                } else if(value.label === 'DONE') {
                    node.iconPath = {
                        light: path.join(__dirname,'..','image',`done.svg`),
                        dark: path.join(__dirname,'..','image',`done_light.svg`)
                    };
                } else if(value.label === 'ABANDON') {
                    node.iconPath = {
                        light: path.join(__dirname,'..','image',`abd.svg`),
                        dark: path.join(__dirname,'..','image',`abd_light.svg`)
                    };
                } else {
                    node.iconPath = {
                        light: path.join(__dirname,'..','image',`doing.svg`),
                        dark: path.join(__dirname,'..','image',`doing_light.svg`)
                    };
                }
                node.label = `${value.label} - ${node.title}`;
                list.refresh();
                list.save(context);
            }
        });
    }));
    vscode.commands.executeCommand('setContext','cj-note.filtered',0);
    vscode.window.registerTreeDataProvider('todolist',list);
    if(context.globalState.get('filtered')) {
        vscode.commands.executeCommand('setContext','cj-note.filtered',context.globalState.get('filtered'));
    } else {
        vscode.commands.executeCommand('setContext','cj-note.filtered',0);
    }
}

export function deactivate() {}
