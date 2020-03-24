//生成砰砰怪兽的种子
let _ = require('lodash');
let fs = require('fs');
let crypto = require('crypto');
let Ut = require("./ut");
//循环次数
let times = 13;
//元素
let  element = [1,2,3,4,5,6,7];
//元素
let elementcp = [7,6,5,4,5,6,7];
//元素对应的倍数
let element_multiple = {'1':5,'2':10,'3':15,'4':20,'5':25,'6':30,'7':35};

let dirPath = "201803291121";



//create_seed(355,365);
(async () => {
    console.time('ForEach');
    for (let i = 0; i<100000; i++) {
        create_seed(1,8400);
        await Ut.sleep(10);
    }
    console.timeEnd('ForEach');
})();

//生成种子方法
//步骤
//1.生成数组
//2.判断是否可以消除
//3.不可消除  退出循环
function create_seed(start=0,end=8400) {
    console.time('create_seed');
    //最终返回的数组
    let result = {};
    //图案集合
    result['content'] = [];
    //总倍数
    result['multiple'] = 0;
    //消除元素的坐标集合
    result['disappear'] = [];
    //总次数
    result['times'] = 0;
    //消除次数
    result['dis_num'] = 0;
    //每次掉落的集合
    result['drop'] = [];

    //图案
    let pattern = [];
    //消除后的图案
    let fillpattren = [];

    for (let time = 1;time <= times;time++) {
        result['times'] = time;
        //返回的结果
        let res = [];
        let type = 1; 
        //判断第几次循环 如果第一次循环 随机生成数组 第十二次循环生成不可消除的数组

        /****生成数组****/
        if (time == 1) {
            pattern = creat_rand();
        }else if(time == 13){
            type = 1;
            let not_fill = filling_pattern(fillpattren,type);
            console.log(not_fill['content']);
            let not_fillpattren = not_fill['content'];
            let not_fillarr = creat_notdisappear(not_fillpattren);
            if (!_.isEmpty(not_fillarr['push'])) {
                result['drop'].push(not_fillarr['push']);
            }
            console.log(not_fillarr['content']);
            pattern = not_fillarr['content'];    
        }else {
            if (!_.isEmpty(fillpattren)) {
                type = 0;
                let fill = filling_pattern(fillpattren,type);
                if (!_.isEmpty(fill['push'])) {
                    result['drop'].push(fill['push']);
                }
                console.log(fill['content']);
                pattern = fill['content'];
            }
        }

        /****判断是否可以消除  返回结果 ****/
        res = check_disappear(pattern);

        if (!_.isEmpty(res)) {
            result['content'].push(res['content']);
            if (_.isArray(res['disappears']) && !_.isEmpty(res['disappears'])) {
                result['disappear'].push(res['disappears']);
            }
            result['multiple'] += res['multiple'];
            result['dis_num'] = result['times'] - 1;

            //不可消除  退出循环
            if (0 == res["multiple"] || _.isEmpty(res["disappear"])) {
                console.timeEnd('create_seed');
                console.log('====最终的数组 start====');
                console.log(JSON.stringify(result));
                console.log('====最终的数组 end====');

                //增加写入文件的判断条件（倍数区间 start end） 
                if (result['multiple'] >= start && result['multiple'] <= end) {
                    let fileDirectory = dirPath + '/' + result['multiple'] + '/';
                    let fileDirectoryflag = fsExistsSync(fileDirectory);
                    if (false == fileDirectoryflag) {
                        fs.mkdir(fileDirectory,function(err){
                            if (err) {
                                return console.error(err);
                            }
                            console.log("目录创建成功。"+fileDirectory);
                        });
                    }
                    console.log(fileDirectory);
                    //种子写入文件
                    let str = JSON.stringify(result);
                    //加密
                    let str_sha1 = sha1Encrypt(str);
                    fs.appendFile('./'+fileDirectory+'/'+str_sha1+'.txt', str,  (err)=> {
                        if(!err) console.log('生成种子完成！'+str_sha1);
                    });
                }
                return result;
            }
            //消除后的图案
            fillpattren = res['fill'];


        }else {
            console.timeEnd('create_seed');
            console.log('*********程序错误！************');
            return false;
        }


    }
}



/***************判断是否可以消除 ******************/
//逻辑：生产一个随机的4*5矩形  获取元素的个数 根据元素个数（大于等于3个才有可能生成一个相连的图案）判断坐标是否相连 如果相连存储可以消除的数组返回
function check_disappear(pattern) {
    //判断格式 如果数组长度等于5 进行转换
    if (pattern.length == 5) {
        pattern = array_change(pattern,4,5);
    }
    let res = _.clone(pattern);
    console.log('====带入的数组 start====');
    console.log(res);
    console.log('====带入的数组 end====');
    let result = {};
    result['content'] = {};
    result['multiple'] = 0;
    result['disappear'] = [];
    result['disappears'] = [];
    result['fill'] = [];

    //获取元素个数集合
    let element_array =  count_element(res);
    //根据元素个数集合和生成的图形 获取各个元素的坐标
    for (let e=1;e<=7;e++) {
        //判断元素数量大于等于3时 校验坐标是否可以组成可消除图案
        if (element_array['nums'][e] >=3) {
            let photos =  check_coordinate(element_array['coor'][e],e);
            if (!_.isEmpty(photos)) {
                console.log('!===============');
                console.log(photos);
                console.log('===============!');
                result['multiple'] += photos['multiple'];
                if (_.isArray(photos['eliminate']) && !_.isEmpty(photos['eliminate'])) {
                    console.log('====每次返回的坐标++++');
                    console.log(photos['eliminate']);
                    console.log('====每次返回的坐标++++');
                    result['disappear'] = _.concat(result['disappear'],exchange_xy(photos['eliminate'],2));
                    result['disappears'] = _.concat(result['disappears'],exchange_xy(photos['eliminate'],1));
                }
            }
            console.log('===============+++');
            console.log(photos);
            console.log('===============+++');
        }
    }

    //数组翻转
    res = array_change(res,5,4);
    //生成消除之后的数组
    result['fill'] = need_to_fill(res,result['disappears']);

    //数组翻转
    pattern = array_change(pattern,5,4);
    result['content'] = pattern;

    console.log('====一个版面的数组1 start====');
    console.log(pattern);
    console.log('====一个版面的数组1 start====');
    console.log(result['content']);
    console.log('====一个版面的数组2 start====');
    console.log('====一个版面的数组 start====');
    console.log(JSON.stringify(result));
    console.log('====一个版面的数组 end====');
    return result;
}




/***************判断是否可以消除 ******************/


/***************公共方法 ******************/

//生成一个随机的4*5图案数组
function creat_rand() {
    //x轴 i;
    //y轴 j;
    //生成的随机矩形
    let result =[];
    for(let i=0;i<4;i++) {
        result[i] = [];
        for (let j=0;j<5;j++) {
            //result[i][j] = _.random(1,7);
            result[i][j] = _.sample(elementcp);
        }
    }
    //矩形数组
    console.log('====随机生成的数组 start====');
    console.log(result);
    console.log('====随机生成的数组 end====');
    return result;
}

//生成一个不可消除的图案数组
function creat_notdisappear(pattern) {
    let result = [];
    let columns = {};
    let columnsObj = {};
    console.log(pattern.length);
    if (pattern.length == 5) {
        pattern = array_change(pattern,4,5);
    }

    console.log(pattern);
    for (let i = 0; i < pattern.length; i++) {
        columnsObj[i] = [];
        for (let j = 0; j < pattern[i].length; j++) {
            let now = _.random(1,7);
            if (pattern[i][j] == 0) {
                columns[i] = [];
                let coor = [];
                coor.push(i);
                coor.push(j);
                //以后的需要判断是否相连 如果相连 获取元素 加减1
                let result = check_notdisappear(pattern,coor,now);
                console.log('是否能够消除状态'+result['flag']);
                if (result['flag'] == false) {
                    console.log('数字false：'+now);
                    console.log('第几列：'+i);
                    columnsObj[i].push(now);
                    if (!_.isEmpty(columnsObj[i])) {
                        columns[i] = columnsObj[i];
                    }
                    pattern[i][j] = now;
                }else{
                    let elements = _.clone(element);
                    let diff_elements = _.differenceWith(elements,result['res'], _.isEqual);
                    let now_two = _.sample(diff_elements);
                    console.log('数字true：'+now_two);
                    columnsObj[i].push(now_two);
                    if (!_.isEmpty(columnsObj[i])) {
                        columns[i] = columnsObj[i];
                    }
                    pattern[i][j] = now_two;
                }                                 
            }
        }
    }
    pattern = array_change(pattern,5,4);
    console.log(pattern);
    console.log(columns);
    result['content'] = pattern;
    result['push'] = columns;
    return result;

}

//判断是否不可消除
function check_notdisappear(pattern,coor,now) {

    //默认不能消除
    let flag = false;
    let result = [];
    console.log('-------');
    console.log(pattern);
    console.log('-------');
    console.log(now);
    console.log('-------');
    console.log(coor[0]);
    console.log(coor[1]);
    console.log('-------');

    let coor_x = coor[0];
    let coor_x1 = coor[0]-1;
    let coor_x2 = coor[0]+1;
    let coor_y = coor[1];
    let coor_y1 = coor[1]-1;
    let coor_y2 = coor[1]+1;

    //上
    let up = 0;
    //下
    let down = 0;
    //左
    let left = 0;
    //右
    let right = 0;

    if (( 4 == coor_y) && (0 == coor_x)) {//如果x == 0,y == 4 不判断上左边
        down = pattern[coor_x][coor_y1];
        right = pattern[coor_x2][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (down > 0 && right > 0) {
            if (now == down && now == right) {
                flag = true;
            }
        }
    } else if ((4 == coor_y) && (3 == coor_x)) {//如果x==3，y== 4 不判断上右边
        down = pattern[coor_x][coor_y1];
        left = pattern[coor_x1][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (down > 0 && left > 0) {
            if (now == down && now == left) {
                flag = true;
            }
        }
    } else if((3 == coor_x) && (0 == coor_y)) {//如果x==3,y== 0 不判断下右边
        up = pattern[coor_x][coor_y2];
        left = pattern[coor_x1][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (up > 0 && left > 0) {
            if (now == up && now == left) {
                flag = true;
            }
        }
    } else if((0 == coor_x) && (0 == coor_y)) {//如果x==0,y==0 不判断下左边
        up = pattern[coor_x][coor_y2];
        right = pattern[coor_x2][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (up > 0 && right > 0) {
            if (now == up && now == right) {
                flag = true;
            }
        }
    } else if (0 == coor_x) {//如果x == 0 不判断左边
        up = pattern[coor_x][coor_y2];
        down = pattern[coor_x][coor_y1];
        right = pattern[coor_x2][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (up > 0 && down > 0 && right > 0) {
            if (now == up && now == down && now == right) {
                flag = true;
            }
        }
    }else if (3 == coor_x) {//如果x == 3 不判断右边
        up = pattern[coor_x][coor_y2];
        down = pattern[coor_x][coor_y1];
        left = pattern[coor_x1][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (up > 0 && down > 0 && left > 0) {
            if (now == up && now == down && now == left) {
                flag = true;
            }
        }
    }else if(0 == coor_y) {//如果y == 0 不判断下边
        up = pattern[coor_x][coor_y2];
        left = pattern[coor_x1][coor_y];
        right = pattern[coor_x2][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (up > 0 && right > 0 && left > 0) {
            if (now == up && now == right && now == left) {
                flag = true;
            }
        }
    }else if(4 == coor_y){//如果y == 4 不判断上边
        down = pattern[coor_x][coor_y1];
        left = pattern[coor_x1][coor_y];
        right = pattern[coor_x2][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (down > 0 && right > 0 && left > 0) {
            if (now == down && now == right && now == left) {
                flag = true;
            }
        }
    }else{
        up = pattern[coor_x][coor_y2];
        down = pattern[coor_x][coor_y1];
        left = pattern[coor_x1][coor_y];
        right = pattern[coor_x2][coor_y];
        //判断相邻的是否为0  为0 不做判断
        if (up > 0 && down > 0 && right > 0 && left > 0) {
            if (now == up && now == down && now == right && now == left) {
                flag = true;
            }
        }
    }
    //如果上下左右的相同的元素个数 存在一个 能够消除
    let res = [];
    res.push(up);
    res.push(down);
    res.push(left);
    res.push(right);
    if (_.indexOf(res,now) > -1) {
        flag = true;
    }
    console.log('________');
    console.log(res.indexOf(now));
    console.log('________');

    console.log('上：'+up+',下：'+down+'，左：'+left+'，右'+right);
    result['flag'] = flag;
    result['res'] = res;
    return result;
}

//生成消除后的图案
function need_to_fill(pattern,disappers) {
    //默认值
    let dafault = 0;
    console.log(pattern);
    for (let i = 0;i < disappers.length; i++) {
        pattern[disappers[i][0]][disappers[i][1]] = dafault;
    }
    return pattern;
}

//随机填充图案
function filling_pattern(arr,type) {
    let returnData = {};
    returnData['push'] = {};
    returnData['content'] = [[], [], [], [], []];
    console.info('filling_pattern');
    console.info(arr);
    // 行转列
    let y = [[], [], [], []];
    _(arr).each(function (value) {
        y[0].push(value[0]);
        y[1].push(value[1]);
        y[2].push(value[2]);
        y[3].push(value[3]);
    });

    let k = 0;

    console.info(y);

    _(y).each(function (v) {
        let tmp = _.pull(v, 0);
        // console.info(tmp);

        if (tmp.length != 5) {
            returnData['push'][k] = [];

            let forNum = 5 - tmp.length;
            let tmp2 = [];
            for (let i = 0; i<forNum; i++) {
                if (1 != type) {
                    console.info('+++++++++++++++++++++++++++++++++++++++++');
                    console.info(type);
                    console.info('+++++++++++++++++++++++++++++++++++++++++');
                    //tmp2.push(_.random(1, 7));
                    tmp2.push(_.sample(elementcp));
                }else {
                   tmp2.push(0); 
                }
                
            }

            let newLine = tmp2.concat(tmp);
            returnData['push'][k] = tmp2;

            y[k] = newLine;
        }

        // 列转行
        returnData['content'][0][k] = y[k][0];
        returnData['content'][1][k] = y[k][1];
        returnData['content'][2][k] = y[k][2];
        returnData['content'][3][k] = y[k][3];
        returnData['content'][4][k] = y[k][4];


        k++;
    });
    return returnData;
}


//转换数组行列
function array_change(data,start,end) {
    let res = [];
    for(let i=0;i<start;i++) {
        res[i] = [];
        for(let j=0;j<end;j++) {
            res[i][j] = data[j][i];
        }
    }
    return res;
}

//获取元素个数
function count_element(pattern) {
    let res = {};
    res['nums'] = {};
    res['coor'] = {};
    res['x'] = {};
    res['y'] = {};
    for (let e=1;e<=7;e++) {
        res['nums'][e] = 0;
        res['coor'][e] = [];
        res['x'][e] = [];
        res['y'][e] = [];
        //循环获取每个元素的数量
        for(let i=0;i<pattern.length;i++) {
            for (let j=0;j<pattern[i].length;j++) {
                if (pattern[i][j] == e) {
                    res['nums'][e] ++;
                    let xy = set_array(i,j);
                    res['coor'][e].push(xy);
                    res['x'][e].push(i);
                    res['y'][e].push(j);
                }
            }
        }
    }
    console.log('****返回每个元素的坐标 start****');
    console.log(res['coor']);
    console.log('***返回每个元素的坐标 end*****');
    console.log('********');
    console.log(JSON.stringify(res));
    console.log('********');
    return res;
}

//判断是否相连 相连返回 图案
function check_coordinate(data,element) {
    let res = [];
    let result = {};
    let multiple = 0;



    for (let i =0;i<data.length;i++) {
        let j = 0;
        console.log(i);
        if (i>=0) {
            console.log('元素++++++++++++++ '+element);
            let array  = unset_array(data,data[i],i);
            console.log('+++++++++++返回的数组++++++++++++++');
            console.log(array);
            if (_.isArray(array) && !_.isEmpty(array)) {
                res.push(array);
            }
            console.log('返回的数组++++++++++++++ '+ JSON.stringify(res));

        }
    }
    if (!_.isEmpty(res)) {
        //res.sort();
        console.log('返回的数组++++++++++++++调整 ' + JSON.stringify(res));
        res = check_array(res);
        console.log('返回的数组++++++++++++++调整2 ' + JSON.stringify(res));

        //获取总倍数
        if (res.length > 0) {
            for (let i = 0; i < res.length; i++) {
                multiple += res[i].length * element_multiple[element];
            }
        }

    }
    result['eliminate'] = res;
    result['multiple'] = multiple;
    console.log(element);
    console.log(res);
    console.log(result);
    return result;
}

//翻转坐标数组
function exchange_xy(data,type) {
    let res = [];
    let result = [];
    for(let i=0;i<data.length;i++) {
        result[i] = [];
        for(let j=0;j<data[i].length;j++) {
            res.push(flip_coordinate(data[i][j]));
            result[i][j] = flip_coordinate(data[i][j]);
        }
    }
    console.log('翻转坐标数组');
    console.log(res);
    console.log(result);
    console.log('翻转坐标数组');
    if (1 == type) {
        return res;
    }else {
        return result;
    }
}

//翻转坐标
function flip_coordinate(data) {
    let result = [];
    if (_.isArray(data) && !_.isEmpty(data)) {
        for(let i=(data.length-1);i>=0;i--) {
            result.push(data[i]);
        }
    }
    return result;
}

function unset_array(data,value,key) {
    console.log(value);
    console.log(data);
    let count = 0;
    let res = [];
    let result = [];
    let disappear = [];

    for (let i = 0; i< data.length; i++) {
        let xy = data[i][0] + '-' + data[i][1];
        res.push(xy);
    }
    console.log('+++++++++++res');
    console.log(res[key]);
    console.log(res);
    console.log('res++++++++++++++++++++');
    let su = [];
    //上
    su.push(value[0] + '-'+ (value[1] + 1));
    //下
    su.push(value[0] + '-'+ (value[1] - 1));
    //左
    su.push((value[0] - 1) + '-'+ value[1]);
    //右
    su.push((value[0] + 1) + '-'+ value[1]);

    console.log('元素+++++++++');
    console.log('su');
    console.log(su);
    console.log('su');

    //循环判断剩余的坐标是否在上下左右数组中
    for (let i =0; i < res.length;i++) {
        if (_.indexOf(su,res[i])> -1) {
            disappear.push(i);
            count ++;
        }
    }

    console.log('++++++++++++数量-------------');
    console.log(count);
    console.log('++++++++++++++++-------------');

    if (count >= 2) {
        result.push(data[key]);
        _.forEach(disappear, function(v, k) {
            result.push(data[v]);
        });
    }

    //排序
    result.sort();

    //console.log('数量'+count);
    console.log(disappear);
    console.log('!-------------');
    console.log(result.length);
    console.log(result);
    console.log('-------------!');
    return result;
}

// 组成一个数组
function set_array(x,y) {
    let res = [];
    res.push(x);
    res.push(y);
    console.log('==xy轴组成一个数组 start==');
    console.log(res);
    console.log('==xy轴组成一个数组 end==');
    return res;
}

//检查数组
function check_array(array) {
    console.log('++++++++______传入的数组');
    console.log(array);
    console.log('++++++++______传入的数组');
    let res = [];
    for (let i =0; i<array.length;i++) {
        let j = i+1;
        for (let z =1; z<array.length;z++) {
            console.log(i);
            console.log('z');
            console.log(z);
            let flag = check_two_array(array[i],array[z]);
            console.log(flag);
            if (flag) {
                array[i] = [];
                array[z] = flag;
            }
        }

        if (j >=array.length) {
            console.log('______');
            console.log(array);
            console.log('_________');
            for (let i =0;i<array.length;i++) {

                if (!_.isEmpty(array[i])) {
                    res.push(array[i]);
                }
            }
            return res;
        }
    }
}

//合并两个数组并删除重复值
function check_two_array(one,two) {
    console.log(one);
    console.log(two);
    let a_l = 0;
    let b_l = 0;
    if (!_.isEmpty(one)) {
        a_l = one.length;
    }
    console.log(a_l);
    if (!_.isEmpty(two)) {
        b_l = two.length;
    }

    console.log(b_l);
    let c = _.unionWith(one,two,_.isEqual);
    let c_l = c.length;

    console.log(c);
    if (c_l - b_l == a_l) {
        return false;
    }
    return c;
}

//加密
function sha1Encrypt(encryptString) {
    let hasher = crypto.createHash("sha1");
    hasher.update(encryptString);
    encryptString= hasher.digest('hex');
    return encryptString;
}

//检查文件目录
function fsExistsSync(path) {
    try{
        fs.accessSync(path,fs.F_OK);
    }catch(e){
        return false;
    }
    return true;
}

//递归创建目录 同步方法
function mkdirsSync(dirname) {
    path = dirPath;
    //console.log(dirname);
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}


/***************公共方法 ******************/