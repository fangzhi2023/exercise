
document.getElementById("pause").style.display = "none"

// 结果展示
const showResult = getResultHandler();

// 演示界面
const createNode = getDashboardHandler();
const nodes = {};
const n = 54;
const m = 6;
for(let i=1; i<=n; i++) {
    nodes[i] = createNode(i);
}
const groups = [];
let arr = [];
for(let i=1; i<=n; i++) {
    arr.push(i);
    if (i % m === 0) {
        groups.push([...arr]);
        arr = [];
    }
}
if (arr.length > 0) {
    groups.push(arr)
}

showTip("分组")
setTimeout(layout, 1000);

let timer;
let step = 0;
let isPause = false;
let isStop = false;
async function start() {
    document.getElementById("start").style.display = "none"
    document.getElementById("pause").style.display = "initial"
    isPause = false;
    isStop = false;
    const nextStep = createProcess();
    let delay = 200;
    function process() {
        clearTimeout(timer)
        timer = setTimeout(async () => {
            if (!isPause && !isStop) {
                delay = 200;
                await nextStep();
            } else {
                delay = 1000;
            }
            process();
        }, delay);
    }
    process();
}

function pause() {
    isPause = true;
    document.getElementById("start").style.display = "initial"
    document.getElementById("pause").style.display = "none"
}

function restart() {
    clearTimeout(timer);
    clearResult();
    step = 0;
    start();
}

function createProcess() {
    const lines = getLines();
    return async () => {
        const line = lines[step++];
        if (!line) {
            isStop = true;
            await showTip("选取完毕");
        } else if (line.tip) {
            await showTip(line.tip);
        } else {
            await checkGroup(line);
        }
    }
}

function showTip(tip, flag = true) {
    return new Promise(resolve => {
        document.getElementById("tip").innerHTML = tip;
        document.getElementById("tip").style.display = 'initial';
        setTimeout(() => {
            if(flag) document.getElementById("tip").style.display = 'none';
            resolve();
        }, 3000)
    });
}

function getLines() {
    const ans = [];
    const height = groups.length;
    const width = groups[0].length;
    ans.push({ tip: "横向选取 "})
    for(let y=0; y<height; y++) {
        const t = [];
        for(let x=0; x<width; x++) {
            t.push(groups[y][x]);
        }
        ans.push(t);
    }
    ans.push({ tip: "纵向选取 "})
    for(let x=0; x<width; x++) {
        const t = [];
        for(let y=0; y<width; y++) {
            t.push(groups[y][x]);
        }
        ans.push(t);
    }
    for(let x=1; x<width; x++) {
        ans.push({ tip:`横向跨${x}行选取` })
        for(let y=0; y<height; y++) {
            const t = [groups[y][0]];
            for(let i=0; i<width-1; i++) {
                const x0 = (x+i*x) % width;
                const y0 = (y+i+1) % height;
                t.push(groups[y0][x0]);
            }
            ans.push(t);
        }
    }
    return ans;
}

let lastGroup;
async function checkGroup(group) {
    return new Promise(resolve => {
        if (lastGroup) {
            activeGroup(lastGroup, false)
        }
        activeGroup(group, true);
        lastGroup = group;
        // 校验
        let nodes = [];
        for(let i=0, len=results.length; i<len; i++) {
            const g = results[i];
            nodes = [];
            for(let j=0, len2=group.length; j<len2; j++) {
                if (g.indexOf(group[j]) !== -1) {
                    nodes.push(group[j])
                }
            }
            if (nodes.length > 1) {
                highlightRows(i, nodes);
                break;
            }
        }
        if (nodes.length < 2) {
            chooseGroup(group);
        }
        setTimeout(() => {
            resolve();
        }, 3000)
    });
}
async function chooseGroup(group) {
    return new Promise(resolve => {
        results.push([...group])
        resultRows.push(showResult(group));
        highlightGroup(group, true);
        setTimeout(() => {
            highlightGroup(group, false);
            resolve();
        }, 3000)
    });
}

// dashboard
function moveToGroup(groupId, node) {
    const group = groups[groupId];
    for(let i=0, len=groups.length; i<len; i++) {
        const index = groups[i].indexOf(node);
        if (index > -1) {
            groups[i].splice(index, 1);
            group.push(node);
        }
    }
    layout()
}
function activeGroup(group, active) {
    for(let item of group) {
        activeGroupNode(item, active);
    }
}
function activeGroupNode(item, active) {
    const node = nodes[item];
    active ? node.classList.add('active') : node.classList.remove("active")
}
function highlightGroup(group, active) {
    for(let item of group) {
        highlightGroupNode(item, active);
    }
}
function highlightGroupNode(item, active) {
    const node = nodes[item];
    active ? node.classList.add('highlight') : node.classList.remove("highlight")
}
function layout() {
    for(let i=0; i<groups.length; i++) {
        const arr = groups[i];
        for(let j=0; j<arr.length; j++) {
            nodeLayout(arr[j], i, j);
        }
    }
}
async function nodeLayout(item, i, j) {
    const node = nodes[item];
    node.style.top = `${44 * i}px`
    node.style.left = `${40 * j}px`
}
function getDashboardHandler() {
    const container = document.getElementById("dashboard");
    return (n) => {
        const el = document.createElement("div");
        el.classList.add("item");
        el.textContent = n;
        container.append(el);
        return el;
    }
}
// result
let results = [];
let resultRows = [];
function clearResult() {
    results = [];
    resultRows = [];
    document.getElementById("result").innerHTML = "";
}
function getResultHandler() {
    const container = document.getElementById("result");
    return (group) => {
        const groupElem = document.createElement("div");
        const nodes = {}
        for(let item of group) {
            const elem = document.createElement("div");
            elem.classList.add("item");
            elem.textContent = item;
            groupElem.append(elem);
            nodes[item] = elem;
        }
        container.append(groupElem)
        return nodes;
    }
}

function highlightRows(rowId, nodeIds) {
    warnRows(rowId, nodeIds, true);
    setTimeout(() => {
        warnRows(rowId, nodeIds, false);
    }, 3000)
}
function warnRows(rowId, nodeIds, active) {
    for(let i=0; i<nodeIds.length; i++) {
        const node = resultRows[rowId][nodeIds[i]];
        active ? node.classList.add("warn") : node.classList.remove("warn")
    }
}
