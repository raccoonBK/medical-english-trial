import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const GOALS = [
  { id: 'foundation', title: '打好术语基础', detail: '先建立英文术语与含义的对应。', kind: '辨义选择' },
  { id: 'exam', title: '准备英语考试', detail: '试一试无选项的英文提取。', kind: '术语输入' },
  { id: 'overseas', title: '了解海外行医难度', detail: '从患者用语转到医学术语。', kind: '情境判断' },
];

// 公开样例由本项目独立编写；不引用商业教材的题目、讲解和课程结构。
const CARDS = [
  {
    term: 'dyspnea',
    meaning: '呼吸困难',
    note: '这是症状描述，不说明病因。',
    patient: 'I feel short of breath when I walk upstairs.',
    patientChinese: '我上楼时会觉得气短。',
    exam: 'The patient reports ____ when walking upstairs.',
  },
  {
    term: 'edema',
    meaning: '水肿',
    note: '表示组织肿胀，仍需结合部位和其他信息。',
    patient: 'My ankles look swollen in the evening.',
    patientChinese: '晚上我的脚踝看起来肿了。',
    exam: 'The examination notes ankle ____.',
  },
  {
    term: 'tachycardia',
    meaning: '心动过速',
    note: '术语提示心率偏快，不单独构成诊断。',
    patient: 'My heart feels like it is beating very fast.',
    patientChinese: '我觉得心跳很快。',
    exam: 'The record describes a fast heart rate as ____.',
  },
];

const STORAGE_KEY = 'medical-english-public-trial-v1';

function readProgress() {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return {};
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeProgress(value) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* 存储受限时仍可完成本轮 */ }
}

function Button({ children, onPress, secondary, disabled, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{children}</Text>
    </Pressable>
  );
}

export default function App() {
  const [goal, setGoal] = useState(null);
  const [stage, setStage] = useState('start');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [scores, setScores] = useState([]);
  const [progress, setProgress] = useState(readProgress);

  const current = CARDS[index];
  const currentGoal = GOALS.find((item) => item.id === goal);
  const isCorrect = goal === 'foundation'
    ? answer === current.meaning
    : goal === 'overseas'
      ? answer === current.term
      : answer.trim().toLowerCase() === current.term;

  useEffect(() => {
    if (stage !== 'result' || !goal) return;
    const next = { ...progress, [goal]: { completed: (progress[goal]?.completed || 0) + 1, lastScore: scores.filter(Boolean).length } };
    setProgress(next);
    writeProgress(next);
    // 成绩仅在进入结果页时保存一次，不据此推断考试或临床能力。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function begin() {
    if (!goal) return;
    setStage('learn');
    setIndex(0);
    setScores([]);
    setAnswer('');
    setChecked(false);
  }

  function nextLearn() {
    if (index < CARDS.length - 1) setIndex(index + 1);
    else { setIndex(0); setStage('quiz'); }
  }

  function nextQuestion() {
    if (!checked) {
      if (!answer.trim()) return;
      setScores([...scores, isCorrect]);
      setChecked(true);
      return;
    }
    if (index < CARDS.length - 1) {
      setIndex(index + 1);
      setAnswer('');
      setChecked(false);
    } else setStage('result');
  }

  function reset() {
    setStage('start');
    setGoal(null);
    setIndex(0);
    setAnswer('');
    setChecked(false);
    setScores([]);
  }

  const choices = goal === 'foundation'
    ? CARDS.map((item) => item.meaning)
    : CARDS.map((item) => item.term);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>医语</Text>
        <Text style={styles.headerTag}>公开试学样例</Text>
      </View>

      {stage === 'start' && (
        <>
          <Text style={styles.eyebrow}>三分钟了解适合你的练习</Text>
          <Text style={styles.title}>学医学英语，先看你的目标。</Text>
          <Text style={styles.intro}>同样的三个术语，目标不同，练习方式也不同。选择一条路线，先看词义，再完成三道短题。</Text>
          <View style={styles.notice}><Text style={styles.noticeText}>本页仅含独立编写的公开样例。完整课程尚在医学内容与使用范围审校中。</Text></View>
          <Text style={styles.sectionTitle}>你现在最想练什么？</Text>
          {GOALS.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: goal === item.id }}
              onPress={() => setGoal(item.id)}
              style={[styles.goalCard, goal === item.id && styles.goalSelected]}
            >
              <View style={styles.goalTop}><Text style={styles.goalTitle}>{item.title}</Text><Text style={styles.goalKind}>{item.kind}</Text></View>
              <Text style={styles.goalDetail}>{item.detail}</Text>
              {progress[item.id] && <Text style={styles.goalProgress}>上次答对 {progress[item.id].lastScore} / 3 · 已试学 {progress[item.id].completed} 次</Text>}
            </Pressable>
          ))}
          <Button onPress={begin} disabled={!goal}>开始试学</Button>
        </>
      )}

      {stage === 'learn' && (
        <>
          <Text style={styles.eyebrow}>{currentGoal?.title} · 先理解 {index + 1} / 3</Text>
          <Text style={styles.title}>先看意思，再自己提取。</Text>
          <View style={styles.learningCard}>
            <Text style={styles.term}>{current.term}</Text>
            <Text style={styles.meaning}>{current.meaning}</Text>
            <View style={styles.rule} />
            <Text style={styles.body}>{current.note}</Text>
            <Text style={styles.caseLabel}>患者可能会说</Text>
            <Text style={styles.caseText}>{current.patient}</Text>
            <Text style={styles.caption}>{current.patientChinese}</Text>
          </View>
          <Text style={styles.hint}>后面的练习不会显示这张卡片；请先自己回想。</Text>
          <Button onPress={nextLearn}>{index === CARDS.length - 1 ? '开始三道练习' : '看下一个术语'}</Button>
        </>
      )}

      {stage === 'quiz' && (
        <>
          <Text style={styles.eyebrow}>{currentGoal?.kind} · 第 {index + 1} / 3 题</Text>
          <Text style={styles.title}>{goal === 'foundation' ? `${current.term} 表示什么？` : goal === 'exam' ? '写出缺少的医学术语。' : '这句话对应哪个医学术语？'}</Text>
          <View style={styles.questionCard}>
            <Text style={styles.questionContext}>{goal === 'exam' ? current.exam : goal === 'overseas' ? current.patient : '请选择中文含义。'}</Text>
            {goal === 'overseas' && <Text style={styles.caption}>{current.patientChinese}</Text>}
          </View>
          {goal === 'exam' ? (
            <TextInput
              accessibilityLabel="输入医学术语"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!checked}
              onChangeText={setAnswer}
              placeholder="请输入英文医学术语"
              style={styles.input}
              value={answer}
            />
          ) : choices.map((choice) => (
            <Pressable
              key={choice}
              accessibilityRole="button"
              accessibilityState={{ selected: answer === choice, disabled: checked }}
              disabled={checked}
              onPress={() => setAnswer(choice)}
              style={[styles.choice, answer === choice && styles.choiceSelected]}
            ><Text style={styles.choiceText}>{choice}</Text></Pressable>
          ))}
          {checked && (
            <View accessibilityLiveRegion="polite" style={[styles.feedback, isCorrect ? styles.feedbackRight : styles.feedbackWrong]}>
              <Text style={styles.feedbackTitle}>{isCorrect ? '答对了' : '这题再记一次'}</Text>
              <Text style={styles.body}>正确术语：{current.term}；含义：{current.meaning}。{current.note}</Text>
            </View>
          )}
          <Button onPress={nextQuestion} disabled={!checked && !answer.trim()}>{checked ? index === CARDS.length - 1 ? '看本轮结果' : '下一题' : '检查答案'}</Button>
        </>
      )}

      {stage === 'result' && (
        <>
          <Text style={styles.eyebrow}>本轮试学完成</Text>
          <Text style={styles.title}>你答对了 {scores.filter(Boolean).length} / 3 题。</Text>
          <Text style={styles.intro}>这是一次很短的演示，只能说明你刚才在这三题上的表现，不能预测考试成绩或临床交流能力。</Text>
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>你刚试过的路线</Text>
            <Text style={styles.resultGoal}>{currentGoal?.title}</Text>
            <Text style={styles.body}>想提高难度，可以返回后改选另一目标；同一组术语会改用不同提取方式。</Text>
          </View>
          <Button onPress={reset}>改选学习目标</Button>
          <Button onPress={() => { setStage('learn'); setIndex(0); setScores([]); setAnswer(''); setChecked(false); }} secondary>再练这一条路线</Button>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>医语公开试学 · 仅供教育体验，不用于诊断或临床决策。</Text>
        <Text style={styles.footerText}>练习记录只保存在当前浏览器；清除浏览器数据后会消失。</Text>
      </View>
    </ScrollView>
  );
}

const colors = { ink: '#1C392F', green: '#176B59', muted: '#697B70', paper: '#F6F4ED', white: '#FFFFFF', line: '#D8DED5' };
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  container: { width: '100%', maxWidth: 650, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 42 },
  header: { paddingTop: 28, paddingBottom: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.green, fontSize: 29, fontWeight: '800', letterSpacing: 1 },
  headerTag: { color: colors.green, borderColor: '#C8D8CF', borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, fontSize: 12 },
  eyebrow: { color: colors.green, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginBottom: 11 },
  title: { color: colors.ink, fontSize: 31, fontWeight: '800', lineHeight: 42, marginBottom: 13 },
  intro: { color: '#53675B', fontSize: 16, lineHeight: 27, marginBottom: 23 },
  notice: { backgroundColor: '#E9EFE5', padding: 16, borderRadius: 17, marginBottom: 28 },
  noticeText: { color: '#476456', fontSize: 14, lineHeight: 22 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '700', marginBottom: 14 },
  goalCard: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderRadius: 18, padding: 18, marginBottom: 12 },
  goalSelected: { borderColor: colors.green, backgroundColor: '#F1F8F1' },
  goalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  goalTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  goalKind: { color: colors.green, fontSize: 12, backgroundColor: '#E4F0E9', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  goalDetail: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 7 },
  goalProgress: { color: colors.green, fontSize: 12, marginTop: 9 },
  button: { backgroundColor: colors.green, borderRadius: 15, paddingVertical: 17, paddingHorizontal: 20, marginTop: 20, alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.green, marginTop: 12 },
  secondaryButtonText: { color: colors.green },
  disabledButton: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  learningCard: { backgroundColor: colors.white, borderRadius: 22, padding: 23, marginTop: 11, marginBottom: 13, borderWidth: 1, borderColor: colors.line },
  term: { color: colors.green, fontSize: 31, fontWeight: '700', marginBottom: 8 },
  meaning: { color: colors.ink, fontSize: 21, fontWeight: '700' },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: 21 },
  body: { color: '#53675B', fontSize: 15, lineHeight: 25 },
  caseLabel: { color: colors.green, fontSize: 13, fontWeight: '700', marginTop: 26, marginBottom: 9 },
  caseText: { color: colors.ink, fontSize: 17, lineHeight: 27 },
  caption: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 7 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  questionCard: { backgroundColor: '#E7EEE5', borderRadius: 18, padding: 20, marginTop: 10, marginBottom: 19 },
  questionContext: { color: colors.ink, fontSize: 17, lineHeight: 27, fontWeight: '600' },
  choice: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 2, borderRadius: 14, padding: 16, marginBottom: 10 },
  choiceSelected: { borderColor: colors.green, backgroundColor: '#F0F8F1' },
  choiceText: { color: colors.ink, fontSize: 16 },
  input: { backgroundColor: colors.white, color: colors.ink, borderColor: colors.line, borderWidth: 2, borderRadius: 14, padding: 16, fontSize: 17 },
  feedback: { padding: 17, borderRadius: 16, marginTop: 12 },
  feedbackRight: { backgroundColor: '#E2F0E5' },
  feedbackWrong: { backgroundColor: '#F7EBDD' },
  feedbackTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  resultCard: { backgroundColor: colors.white, borderRadius: 19, borderColor: colors.line, borderWidth: 1, padding: 22, marginTop: 5, marginBottom: 8 },
  resultGoal: { color: colors.green, fontSize: 23, fontWeight: '800', marginBottom: 10 },
  footer: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: 42, paddingTop: 19 },
  footerText: { color: '#89978D', fontSize: 11, lineHeight: 18, marginBottom: 3 },
});
