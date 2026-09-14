import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Divider,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Paper,
  Badge,
  useTheme
} from '@mui/material';
import {
  IconX,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconSparkles,
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconChevronDown,
  IconLayersSubtract,
  IconPlayerPlay,
  IconHelp,
  IconBook,
  IconBulb,
  IconTable,
  IconCalendarEvent,
  IconRoute,
  IconChecklist,
  IconListCheck,
  IconShieldCheck,
  IconAdjustmentsHorizontal,
  IconTimeline,
  IconFlame,
  IconCircleCheck
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { openSnackbar } from 'store/slices/snackbar';
import { useDispatch } from 'react-redux';
import { BOSTextField } from 'ui-component/bos';
import { btnSave, btnDelete, btnCancel, btnEdit } from 'ui-component/bos/BOSStyles';

const DEFAULT_ACTIONS = [
  { code: 'SCHEDULE_MEETING', displayName: 'Schedule Meeting (Schedule Date)' },
  { code: 'SCHEDULE_ON_DAY_OF_MONTH', displayName: 'Schedule on Specific Day of Month' },
  { code: 'SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY', displayName: 'Schedule on Specific Day (or Next Working Day if Holiday)' },
  { code: 'SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY', displayName: 'Schedule on Specific Day (or Prev Working Day if Holiday)' },
  { code: 'MOVE_BY_DAYS', displayName: 'Shift Date (+/- Days)' },
  { code: 'MOVE_TO_PREVIOUS_DAY', displayName: 'Move To Previous Day' },
  { code: 'MOVE_TO_NEXT_DAY', displayName: 'Move To Next Day' },
  { code: 'MOVE_TO_PREVIOUS_WORKING_DAY', displayName: 'Move To Previous Working Day' },
  { code: 'MOVE_TO_NEXT_WORKING_DAY', displayName: 'Move To Next Working Day' },
  { code: 'SELECT_FIRST_WORKING_DAY', displayName: 'Select First Working Day' },
  { code: 'SELECT_LAST_WORKING_DAY', displayName: 'Select Last Working Day' },
  { code: 'SKIP_DATE', displayName: 'Skip Date' },
  { code: 'TRY_ANOTHER_CANDIDATE', displayName: 'Try Next Schedule Date' },
  { code: 'APPLY_ANOTHER_RULE', displayName: 'Apply Another Rule' },
  { code: 'STOP_PROCESSING', displayName: 'Stop Processing' },
  { code: 'MARK_AS_INVALID', displayName: 'Mark As Invalid' }
];

const getDayOrdinal = (n) => {
  const num = parseInt(n, 10);
  if (isNaN(num)) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const parseDayParam = (params) => {
  if (!params) return '5';
  try {
    if (typeof params === 'string' && params.startsWith('{')) {
      const parsed = JSON.parse(params);
      return String(parsed.dayOfMonth || parsed.day || parsed.targetDay || '5');
    }
    const clean = String(params).replace(/[^0-9]/g, '');
    return clean || '5';
  } catch (e) {
    return '5';
  }
};

export default function ScheduleRuleBuilderDialog({ open, onClose, configId, meetingId, meetingName = '', existingRules = [], onRuleSaved, onOpenSimulation }) {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [metadata, setMetadata] = useState({ fields: [], operators: [], actions: [], dateGenerators: [], fallbacks: [] });
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sopTab, setSopTab] = useState(0);
  const [demoScenario, setDemoScenario] = useState(0);

  // Local rules list
  const [localRules, setLocalRules] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  // Form State
  const [ruleId, setRuleId] = useState(null);
  const [ruleName, setRuleName] = useState(() => (meetingName ? `${meetingName} 1` : 'Schedule Rule 1'));
  const [description, setDescription] = useState('');
  const [baseDateGenerator, setBaseDateGenerator] = useState('FREQUENCY_DATE');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState('ACTIVE');
  const [isActive, setIsActive] = useState(true);

  // Condition Groups State
  const [conditionGroups, setConditionGroups] = useState([
    {
      id: 'grp_root',
      logicalOperator: 'ALL',
      conditions: [
        { id: 'cond_1', fieldCode: 'DAY_OF_WEEK', operatorCode: 'EQUALS', conditionValue: 'Saturday', dataType: 'LIST', logicalOperator: 'AND' }
      ],
      childGroups: []
    }
  ]);

  // Actions State
  const [actions, setActions] = useState([
    { id: 'act_1', actionType: 'SCHEDULE_MEETING', actionParams: '' }
  ]);

  // Fallbacks State
  const [fallbacks, setFallbacks] = useState([]);

  // Sync existingRules prop to localRules
  useEffect(() => {
    if (existingRules) {
      setLocalRules(existingRules);
    }
  }, [existingRules]);

  // Fetch Metadata
  useEffect(() => {
    if (open) {
      setLoadingMeta(true);
      axios.get(API_PATHS.QMS.SCHEDULE_RULES_METADATA)
        .then(res => {
          if (res.data) {
            setMetadata(res.data);
          }
        })
        .catch(err => {
          console.error('Failed to load rule metadata', err);
        })
        .finally(() => setLoadingMeta(false));
    }
  }, [open]);

  // Helper for auto default rule name & priority
  const getNextRuleDefaults = (rules = []) => {
    const nextNum = (rules?.length || 0) + 1;
    const defaultName = meetingName ? `${meetingName} ${nextNum}` : `Schedule Rule ${nextNum}`;
    const maxPriority = rules && rules.length > 0
      ? Math.max(...rules.map(r => Number(r.priority) || 0))
      : 0;
    const defaultPriority = maxPriority + 1;
    return { defaultName, defaultPriority };
  };

  // Load Rule into Editor
  const loadRule = (rule) => {
    if (!rule) {
      const { defaultName, defaultPriority } = getNextRuleDefaults(localRules.length > 0 ? localRules : existingRules);
      setRuleId(null);
      setRuleName(defaultName);
      setDescription('');
      setBaseDateGenerator('FREQUENCY_DATE');
      setPriority(defaultPriority);
      setStatus('ACTIVE');
      setIsActive(true);
      setConditionGroups([
        {
          id: 'grp_root',
          logicalOperator: 'ALL',
          conditions: [
            { id: 'cond_1', fieldCode: 'DAY_OF_WEEK', operatorCode: 'EQUALS', conditionValue: 'Saturday', dataType: 'LIST', logicalOperator: 'AND' }
          ],
          childGroups: []
        }
      ]);
      setActions([{ id: 'act_1', actionType: 'SCHEDULE_MEETING', actionParams: '' }]);
      setFallbacks([]);
      return;
    }

    setRuleId(rule.id);
    const fallbackName = meetingName ? `${meetingName} 1` : 'Schedule Rule 1';
    setRuleName(rule.ruleName || fallbackName);
    setDescription(rule.description || '');
    setBaseDateGenerator(rule.baseDateGenerator || 'FREQUENCY_DATE');
    setPriority(rule.priority !== undefined && rule.priority !== null ? rule.priority : 1);
    setStatus(rule.status || 'ACTIVE');
    setIsActive(rule.isActive !== false);

    if (rule.conditionGroups && rule.conditionGroups.length > 0) {
      // Filter only root condition groups and ensure each has conditions
      const rootGroups = rule.conditionGroups
        .filter(g => !g.parentId && !g.parentGroupId)
        .map(g => ({
          ...g,
          conditions: (g.conditions && g.conditions.length > 0)
            ? g.conditions
            : [{ id: `cond_${Date.now()}`, fieldCode: 'DAY_OF_WEEK', operatorCode: 'EQUALS', conditionValue: 'Saturday', dataType: 'LIST', logicalOperator: 'AND' }]
        }));
      setConditionGroups(rootGroups.length > 0 ? rootGroups : [
        {
          id: 'grp_root',
          logicalOperator: 'ALL',
          conditions: [{ id: 'cond_1', fieldCode: 'DAY_OF_WEEK', operatorCode: 'EQUALS', conditionValue: 'Saturday', dataType: 'LIST', logicalOperator: 'AND' }],
          childGroups: []
        }
      ]);
    } else {
      setConditionGroups([
        {
          id: 'grp_root',
          logicalOperator: 'ALL',
          conditions: [{ id: 'cond_1', fieldCode: 'DAY_OF_WEEK', operatorCode: 'EQUALS', conditionValue: 'Saturday', dataType: 'LIST', logicalOperator: 'AND' }],
          childGroups: []
        }
      ]);
    }

    if (rule.actions && rule.actions.length > 0) {
      setActions(rule.actions);
    } else {
      setActions([{ id: 'act_1', actionType: 'SCHEDULE_MEETING', actionParams: '' }]);
    }

    if (rule.fallbacks && rule.fallbacks.length > 0) {
      setFallbacks(rule.fallbacks);
    } else {
      setFallbacks([]);
    }
  };

  useEffect(() => {
    if (open) {
      const activeList = localRules.length > 0 ? localRules : existingRules;
      if (activeList && activeList.length > 0) {
        loadRule(activeList[0]);
      } else {
        loadRule(null);
      }
    }
  }, [open]);

  // Condition Group Operations
  const handleAddCondition = (groupId) => {
    setConditionGroups(prev => updateGroup(prev, groupId, (group) => ({
      ...group,
      conditions: [
        ...group.conditions,
        { id: `cond_${Date.now()}`, fieldCode: 'DAY_OF_WEEK', operatorCode: 'EQUALS', conditionValue: 'Saturday', dataType: 'LIST', logicalOperator: 'AND' }
      ]
    })));
  };

  const handleRemoveCondition = (groupId, condId) => {
    setConditionGroups(prev => updateGroup(prev, groupId, (group) => ({
      ...group,
      conditions: group.conditions.filter(c => c.id !== condId)
    })));
  };

  const handleUpdateCondition = (groupId, condId, field, value) => {
    setConditionGroups(prev => updateGroup(prev, groupId, (group) => ({
      ...group,
      conditions: group.conditions.map(c => {
        if (c.id === condId) {
          const updated = { ...c, [field]: value };
          if (field === 'fieldCode') {
            const fieldMeta = metadata.fields.find(f => f.code === value);
            if (fieldMeta) {
              updated.dataType = fieldMeta.dataType;
              updated.operatorCode = 'EQUALS';
              if (fieldMeta.availableValues && fieldMeta.availableValues.length > 0) {
                updated.conditionValue = fieldMeta.availableValues[0];
              }
            }
          }
          return updated;
        }
        return c;
      })
    })));
  };

  const handleAddChildGroup = (parentGroupId) => {
    setConditionGroups(prev => updateGroup(prev, parentGroupId, (group) => ({
      ...group,
      childGroups: [
        ...(group.childGroups || []),
        {
          id: `grp_${Date.now()}`,
          logicalOperator: 'ALL',
          conditions: [
            { id: `cond_${Date.now()}`, fieldCode: 'IS_HOLIDAY', operatorCode: 'IS_TRUE', conditionValue: 'true', dataType: 'BOOLEAN', logicalOperator: 'AND' }
          ],
          childGroups: []
        }
      ]
    })));
  };

  const handleRemoveChildGroup = (parentGroupId, childGroupId) => {
    setConditionGroups(prev => updateGroup(prev, parentGroupId, (group) => ({
      ...group,
      childGroups: group.childGroups.filter(g => g.id !== childGroupId)
    })));
  };

  const handleToggleGroupLogical = (groupId) => {
    setConditionGroups(prev => updateGroup(prev, groupId, (group) => {
      const nextGroupOp = group.logicalOperator === 'ALL' ? 'ANY' : 'ALL';
      const defaultCondOp = nextGroupOp === 'ALL' ? 'AND' : 'OR';
      return {
        ...group,
        logicalOperator: nextGroupOp,
        conditions: (group.conditions || []).map(c => ({ ...c, logicalOperator: defaultCondOp }))
      };
    }));
  };

  const handleToggleConditionLogical = (groupId, condId) => {
    setConditionGroups(prev => updateGroup(prev, groupId, (group) => ({
      ...group,
      conditions: group.conditions.map(c => {
        if (c.id === condId) {
          const currentOp = (c.logicalOperator || 'AND').toUpperCase();
          const nextOp = currentOp === 'AND' ? 'OR' : 'AND';
          return { ...c, logicalOperator: nextOp };
        }
        return c;
      })
    })));
  };

  const updateGroup = (groups, targetId, updateFn) => {
    return groups.map(g => {
      if (String(g.id) === String(targetId)) {
        return updateFn(g);
      }
      if (g.childGroups && g.childGroups.length > 0) {
        return { ...g, childGroups: updateGroup(g.childGroups, targetId, updateFn) };
      }
      return g;
    });
  };

  // Action Handlers
  const handleAddAction = () => {
    setActions(prev => [...prev, { id: `act_${Date.now()}`, actionType: 'SCHEDULE_ON_DAY_OF_MONTH', actionParams: '5' }]);
  };

  const handleRemoveAction = (id) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAction = (id, field, val) => {
    setActions(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: val };
        if (field === 'actionType') {
          if ((val === 'SCHEDULE_ON_DAY_OF_MONTH' || val === 'SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY' || val === 'SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY' || val === 'SET_DAY_OF_MONTH' || val === 'SCHEDULE_ON_SPECIFIC_DAY') && !updated.actionParams) {
            updated.actionParams = '5';
          } else if ((val === 'MOVE_BY_DAYS' || val === 'SHIFT_BY_DAYS') && !updated.actionParams) {
            updated.actionParams = '1';
          }
        }
        return updated;
      }
      return a;
    }));
  };

  // Fallback Handlers
  const handleAddFallback = () => {
    setFallbacks(prev => [...prev, { id: `fb_${Date.now()}`, fallbackActionType: 'MOVE_TO_NEXT_WORKING_DAY', priority: prev.length + 1, actionParams: '' }]);
  };

  const handleRemoveFallback = (id) => {
    setFallbacks(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateFallback = (id, field, val) => {
    setFallbacks(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f));
  };

  // Real-Time Human-Readable Rule Preview Generator
  const humanReadablePreview = useMemo(() => {
    let text = `WHEN `;

    const formatGroupText = (group) => {
      const parts = [];

      if (group.conditions && group.conditions.length > 0) {
        const defaultOp = group.logicalOperator === 'ALL' ? 'AND' : 'OR';
        const condTexts = group.conditions.map((c, idx) => {
          const fieldMeta = metadata.fields.find(f => f.code === c.fieldCode);
          const fieldName = fieldMeta ? fieldMeta.displayName : c.fieldCode;
          const opStr = (c.operatorCode || 'EQUALS').toLowerCase().replace(/_/g, ' ');
          const valStr = c.conditionValue || '';
          const expr = `${fieldName} ${opStr} "${valStr}"`;
          if (idx === 0) return expr;
          const conn = (c.logicalOperator || defaultOp).toUpperCase();
          return `${conn} ${expr}`;
        });
        parts.push(condTexts.join(' '));
      }

      if (group.childGroups && group.childGroups.length > 0) {
        const childTexts = group.childGroups.map(cg => `(${formatGroupText(cg)})`);
        parts.push(childTexts.join(group.logicalOperator === 'ALL' ? ' AND ' : ' OR '));
      }

      return parts.join(group.logicalOperator === 'ALL' ? ' AND ' : ' OR ');
    };

    if (conditionGroups && conditionGroups.length > 0) {
      text += conditionGroups.map(g => formatGroupText(g)).filter(Boolean).join(' AND ');
    } else {
      text += `Always`;
    }

    text += `\nTHEN `;
    if (actions && actions.length > 0) {
      const availableActions = (metadata?.actions && metadata.actions.length > 0) ? metadata.actions : DEFAULT_ACTIONS;
      text += actions.map(a => {
        const actMeta = availableActions.find(m => m.code === a.actionType);
        let name = actMeta ? actMeta.displayName : a.actionType;
        if (a.actionType === 'SCHEDULE_ON_DAY_OF_MONTH' || a.actionType === 'SET_DAY_OF_MONTH' || a.actionType === 'SCHEDULE_ON_SPECIFIC_DAY') {
          const day = parseDayParam(a.actionParams);
          name = `Schedule Meeting on ${day}${getDayOrdinal(day)} of Month`;
        } else if (a.actionType === 'SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY') {
          const day = parseDayParam(a.actionParams);
          name = `Schedule on ${day}${getDayOrdinal(day)} of Month (or Next Working Day if Holiday/Weekend)`;
        } else if (a.actionType === 'SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY') {
          const day = parseDayParam(a.actionParams);
          name = `Schedule on ${day}${getDayOrdinal(day)} of Month (or Prev Working Day if Holiday/Weekend)`;
        } else if (a.actionType === 'MOVE_BY_DAYS' || a.actionType === 'SHIFT_BY_DAYS') {
          name = `Shift Date by ${a.actionParams || '1'} Days`;
        }
        return name;
      }).join(', ');
    } else {
      text += `Schedule Meeting`;
    }

    if (fallbacks && fallbacks.length > 0) {
      text += `\nELSE / FALLBACK: `;
      text += fallbacks.map(f => {
        const fbMeta = metadata.fallbacks.find(m => m.code === f.fallbackActionType);
        return fbMeta ? fbMeta.displayName : f.fallbackActionType;
      }).join(' -> ');
    }

    return text;
  }, [conditionGroups, actions, fallbacks, metadata]);

  // Live Rule Validation
  const validationErrors = useMemo(() => {
    const errs = [];
    if (!ruleName.trim()) errs.push('Rule Name is required.');

    let totalConditions = 0;
    const validateGroup = (g) => {
      if (g.conditions) {
        totalConditions += g.conditions.length;
        g.conditions.forEach(c => {
          if (!c.fieldCode) errs.push('A condition is missing a selected field.');
          if (!c.operatorCode) errs.push('A condition is missing a selected operator.');
        });
      }
      if (g.childGroups) g.childGroups.forEach(validateGroup);
    };

    conditionGroups.forEach(validateGroup);

    if (totalConditions === 0) {
      errs.push('At least one condition must be configured under WHEN (Conditions).');
    }

    if (!actions || actions.length === 0) {
      errs.push('At least one THEN action must be configured.');
    }

    return errs;
  }, [ruleName, conditionGroups, actions]);

  // Save Rule
  const handleSave = async () => {
    if (validationErrors.length > 0) {
      dispatch(openSnackbar({
        open: true,
        message: validationErrors[0],
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setSaving(true);
    try {
      const cleanNumericId = (val) => {
        if (val === null || val === undefined) return null;
        const num = Number(val);
        return (!isNaN(num) && typeof val !== 'boolean') ? num : null;
      };

      const sanitizeGroup = (group) => {
        const cleanId = cleanNumericId(group.id);
        const cleanConditions = (group.conditions || []).map(c => ({
          ...c,
          id: cleanNumericId(c.id)
        }));
        const cleanChildGroups = (group.childGroups || []).map(cg => sanitizeGroup(cg));

        return {
          ...group,
          id: cleanId,
          conditions: cleanConditions,
          childGroups: cleanChildGroups
        };
      };

      const sanitizeActions = (acts) => {
        return (acts || []).map(a => ({
          ...a,
          id: cleanNumericId(a.id)
        }));
      };

      const sanitizeFallbacks = (fbs) => {
        return (fbs || []).map(f => ({
          ...f,
          id: cleanNumericId(f.id)
        }));
      };

      // Only send root condition groups
      const rootConditionGroups = (conditionGroups || []).filter(g => !g.parentId && !g.parentGroupId);

      const payload = {
        id: cleanNumericId(ruleId),
        ruleName,
        description: humanReadablePreview || description,
        configId,
        meetingId,
        baseDateGenerator,
        priority: Number(priority) || 1,
        status,
        isActive,
        conditionGroups: rootConditionGroups.map(g => sanitizeGroup(g)),
        actions: sanitizeActions(actions),
        fallbacks: sanitizeFallbacks(fallbacks)
      };

      const res = await axios.post(API_PATHS.QMS.SCHEDULE_RULES, payload);
      dispatch(openSnackbar({
        open: true,
        message: 'Schedule rule saved successfully!',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success'
      }));

      const savedRule = res.data;
      if (savedRule && savedRule.id) {
        setRuleId(savedRule.id);
        setLocalRules(prev => {
          const idx = prev.findIndex(r => r.id === savedRule.id || r.ruleName === savedRule.ruleName);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = savedRule;
            return updated;
          }
          return [...prev, savedRule];
        });
        loadRule(savedRule);
      }
      if (onRuleSaved) onRuleSaved(savedRule);
    } catch (err) {
      console.error('Failed to save rule:', err);
      dispatch(openSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to save rule.',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  // Rule Deletion Handlers
  const handlePromptDeleteRule = (rule) => {
    if (!rule) return;
    setRuleToDelete(rule);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;
    setDeleting(true);
    try {
      if (ruleToDelete.id) {
        await axios.delete(`${API_PATHS.QMS.SCHEDULE_RULES}/${ruleToDelete.id}`);
      } else {
        await axios.delete(`${API_PATHS.QMS.SCHEDULE_RULES}/by-name`, {
          params: {
            ruleName: ruleToDelete.ruleName,
            meetingId: meetingId || undefined,
            configId: configId || undefined
          }
        });
      }

      dispatch(openSnackbar({
        open: true,
        message: `Schedule rule "${ruleToDelete.ruleName}" deleted successfully!`,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success'
      }));

      // Update local rules list
      const remainingRules = localRules.filter(r => r.id !== ruleToDelete.id && r.ruleName !== ruleToDelete.ruleName);
      setLocalRules(remainingRules);
      setDeleteConfirmOpen(false);

      // If the deleted rule was currently selected
      if (ruleId === ruleToDelete.id || ruleName === ruleToDelete.ruleName) {
        if (remainingRules.length > 0) {
          loadRule(remainingRules[0]);
        } else {
          loadRule(null);
        }
      }

      if (onRuleSaved) onRuleSaved();
    } catch (err) {
      console.error('Failed to delete rule:', err);
      dispatch(openSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to delete rule.',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setDeleting(false);
      setRuleToDelete(null);
    }
  };

  // Render Condition Group Recursively
  const renderConditionGroup = (group, isRoot = false) => {
    const isAll = group.logicalOperator === 'ALL';

    return (
      <Card
        key={group.id}
        variant="outlined"
        sx={{
          mb: 2,
          borderColor: isRoot ? 'primary.main' : 'divider',
          bgcolor: isRoot ? (isAll ? 'rgba(14, 165, 233, 0.03)' : 'rgba(245, 158, 11, 0.03)') : 'background.paper',
          borderWidth: isRoot ? 2 : 1
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={isAll ? 'ALL CONDITIONS MUST MATCH (AND)' : 'ANY CONDITION CAN MATCH (OR)'}
                color={isAll ? 'primary' : 'warning'}
                size="small"
                onClick={() => handleToggleGroupLogical(group.id)}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
              <Typography variant="caption" color="text.secondary">
                (Click chip to toggle AND / OR logic)
              </Typography>
            </Stack>
            {!isRoot && (
              <IconButton size="small" color="error" onClick={() => handleRemoveChildGroup(group.parentId, group.id)}>
                <IconTrash size={16} />
              </IconButton>
            )}
          </Stack>

          {/* Conditions Rows */}
          {group.conditions && group.conditions.map((cond, idx) => {
            const selectedFieldMeta = metadata.fields.find(f => f.code === cond.fieldCode);

            return (
              <Box key={cond.id}>
                {idx > 0 && (
                  <Stack direction="row" justifyContent="center" my={0.5}>
                    <Tooltip title="Click to toggle this specific condition logic between AND / OR">
                      <Chip
                        label={(cond.logicalOperator || (isAll ? 'AND' : 'OR')).toUpperCase()}
                        size="small"
                        color={(cond.logicalOperator || (isAll ? 'AND' : 'OR')).toUpperCase() === 'AND' ? 'primary' : 'warning'}
                        variant={(cond.logicalOperator || (isAll ? 'AND' : 'OR')).toUpperCase() === 'AND' ? 'outlined' : 'filled'}
                        onClick={() => handleToggleConditionLogical(group.id, cond.id)}
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          px: 1,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.85, transform: 'scale(1.05)' }
                        }}
                      />
                    </Tooltip>
                  </Stack>
                )}
                <Box
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1.5,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} sm={3.5}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Date Property</InputLabel>
                        <Select
                          value={cond.fieldCode || ''}
                          label="Date Property"
                          onChange={(e) => handleUpdateCondition(group.id, cond.id, 'fieldCode', e.target.value)}
                        >
                          {metadata.fields.map(f => (
                            <MenuItem key={f.code} value={f.code}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.displayName}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({f.category})</Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={cond.operatorCode || 'EQUALS'}
                          label="Operator"
                          onChange={(e) => handleUpdateCondition(group.id, cond.id, 'operatorCode', e.target.value)}
                        >
                          {metadata.operators.map(op => (
                            <MenuItem key={op.code} value={op.code}>{op.displayName}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4.5}>
                      {selectedFieldMeta && selectedFieldMeta.availableValues && selectedFieldMeta.availableValues.length > 0 ? (
                        <FormControl fullWidth size="small">
                          <InputLabel>Value</InputLabel>
                          <Select
                            value={cond.conditionValue || ''}
                            label="Value"
                            onChange={(e) => handleUpdateCondition(group.id, cond.id, 'conditionValue', e.target.value)}
                          >
                            {selectedFieldMeta.availableValues.map(v => (
                              <MenuItem key={v} value={v}>{v}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          label="Value"
                          value={cond.conditionValue || ''}
                          onChange={(e) => handleUpdateCondition(group.id, cond.id, 'conditionValue', e.target.value)}
                          placeholder="e.g. 1, 5 or Saturday"
                        />
                      )}
                    </Grid>

                    <Grid item xs={12} sm={1} textAlign="right">
                      <IconButton size="small" color="error" onClick={() => handleRemoveCondition(group.id, cond.id)}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            );
          })}

          {/* Child Condition Groups */}
          {group.childGroups && group.childGroups.map((cg, cgIdx) => (
            <Box key={cg.id}>
              {((group.conditions && group.conditions.length > 0) || cgIdx > 0) && (
                <Stack direction="row" justifyContent="center" my={1}>
                  <Tooltip title="Click to toggle group logic between AND / OR">
                    <Chip
                      label={isAll ? 'AND' : 'OR'}
                      size="small"
                      color={isAll ? 'primary' : 'warning'}
                      variant={isAll ? 'outlined' : 'filled'}
                      onClick={() => handleToggleGroupLogical(group.id)}
                      sx={{
                        fontWeight: 800,
                        height: 22,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.85, transform: 'scale(1.05)' }
                      }}
                    />
                  </Tooltip>
                </Stack>
              )}
              {renderConditionGroup({ ...cg, parentId: group.id }, false)}
            </Box>
          ))}

          {/* Buttons to Add Condition or Group */}
          <Stack direction="row" spacing={1} mt={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<IconPlus size={14} />}
              onClick={() => handleAddCondition(group.id)}
            >
              Add Condition
            </Button>
            <Button
              size="small"
              variant="dashed"
              startIcon={<IconLayersSubtract size={14} />}
              onClick={() => handleAddChildGroup(group.id)}
              color="secondary"
            >
              Add Condition Group
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconSparkles color="#0284c7" size={24} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Meeting Schedule Rule Builder
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="View Rule Builder Guide & Sample Date SOP">
            <IconButton color="info" size="small" onClick={() => setHelpOpen(true)}>
              <IconHelp size={22} />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 2.5 }}>
        {/* Existing Rules Selector */}
        {localRules && localRules.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, minWidth: 100 }}>
              Configured Rules:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              {localRules.map(r => {
                const isSelected = r.id === ruleId || (!r.id && r.ruleName === ruleName);
                return (
                  <Chip
                    key={r.id || r.ruleName}
                    label={`Priority ${r.priority}: ${r.ruleName}`}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => loadRule(r)}
                    onDelete={() => handlePromptDeleteRule(r)}
                    deleteIcon={
                      <Tooltip title={`Delete ${r.ruleName}`}>
                        <IconTrash size={14} style={{ color: isSelected ? '#ffffff' : '#ef4444' }} />
                      </Tooltip>
                    }
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon:hover': {
                        opacity: 0.8
                      }
                    }}
                  />
                );
              })}
              <Chip
                label="+ Add New Rule"
                color="success"
                variant="outlined"
                onClick={() => loadRule(null)}
                size="small"
                sx={{ cursor: 'pointer', fontWeight: 700 }}
              />
            </Stack>
          </Stack>
        )}
        {/* RULE NAME & PRIORITY CONFIGURATION */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <BOSTextField
                fullWidth
                label="Rule Name"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. 1st Saturday Schedule Policy"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <BOSTextField
                fullWidth
                type="number"
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                helperText="1 = Highest Priority (Evaluated First)"
                required
              />
            </Grid>
          </Grid>
        </Paper>
        <Card sx={{ mb: 3, bgcolor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: 1, borderStyle: 'solid' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <IconSparkles size={18} color="#0284c7" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369a1' }}>
                Human Readable Rule Description (Real-Time Preview)
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line', color: '#0f172a', fontWeight: 600 }}>
              {humanReadablePreview}
            </Typography>
          </CardContent>
        </Card>

        {/* STEP 2 & 3: CONDITIONS BUILDER */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          WHEN (Conditions)
        </Typography>

        {conditionGroups.map(group => renderConditionGroup(group, true))}

        {/* STEP 4: ACTION BUILDER */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
          THEN (Actions)
        </Typography>
        <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: 'background.paper' }}>
          {actions.map((act, idx) => {
            const isDayOfMonth = act.actionType === 'SCHEDULE_ON_DAY_OF_MONTH' ||
              act.actionType === 'SCHEDULE_ON_DAY_OF_MONTH_OR_NEXT_WORKING_DAY' ||
              act.actionType === 'SCHEDULE_ON_DAY_OF_MONTH_OR_PREV_WORKING_DAY' ||
              act.actionType === 'SET_DAY_OF_MONTH' ||
              act.actionType === 'SCHEDULE_ON_SPECIFIC_DAY';
            const isShiftDays = act.actionType === 'MOVE_BY_DAYS' || act.actionType === 'SHIFT_BY_DAYS';
            const availableActions = (metadata?.actions && metadata.actions.length > 0) ? metadata.actions : DEFAULT_ACTIONS;

            return (
              <Stack key={act.id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} mb={idx < actions.length - 1 ? 1.5 : 0}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60 }}>
                  THEN:
                </Typography>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 280 } }}>
                  <Select
                    value={act.actionType}
                    onChange={(e) => handleUpdateAction(act.id, 'actionType', e.target.value)}
                  >
                    {availableActions.map(a => (
                      <MenuItem key={a.code} value={a.code}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.displayName}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Day of Month Parameter Input (1 to 31) */}
                {isDayOfMonth && (
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                    <InputLabel>Target Day of Month</InputLabel>
                    <Select
                      value={parseDayParam(act.actionParams)}
                      label="Target Day of Month"
                      onChange={(e) => handleUpdateAction(act.id, 'actionParams', e.target.value)}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <MenuItem key={day} value={String(day)}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {day}{getDayOrdinal(day)} of Month
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Shift Days (+/-) Parameter Input */}
                {isShiftDays && (
                  <TextField
                    size="small"
                    label="Days (+/-)"
                    type="number"
                    value={act.actionParams || '1'}
                    onChange={(e) => handleUpdateAction(act.id, 'actionParams', e.target.value)}
                    sx={{ width: { xs: '100%', sm: 140 } }}
                    placeholder="+/- Days"
                  />
                )}

                {actions.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => handleRemoveAction(act.id)}>
                    <IconTrash size={16} />
                  </IconButton>
                )}
              </Stack>
            );
          })}
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconPlus size={14} />}
            onClick={handleAddAction}
            sx={{ mt: 1.5 }}
          >
            Add Additional Action
          </Button>
        </Card>

        {/* STEP 5: FALLBACK RULE BUILDER */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          ELSE / FALLBACK (If Rule Fails)
        </Typography>
        <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
          {fallbacks.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
              No fallback rules configured. Click below to add fallback rules.
            </Typography>
          ) : (
            fallbacks.map((fb, idx) => (
              <Stack key={fb.id} direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                <Chip label={`Priority ${fb.priority || idx + 1}`} size="small" color="warning" />
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <Select
                    value={fb.fallbackActionType}
                    onChange={(e) => handleUpdateFallback(fb.id, 'fallbackActionType', e.target.value)}
                  >
                    {metadata.fallbacks.map(f => (
                      <MenuItem key={f.code} value={f.code}>{f.displayName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton size="small" color="error" onClick={() => handleRemoveFallback(fb.id)}>
                  <IconTrash size={16} />
                </IconButton>
              </Stack>
            ))
          )}
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<IconPlus size={14} />}
            onClick={handleAddFallback}
          >
            Add Fallback Rule Level
          </Button>
        </Card>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#fafafa' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {Boolean(ruleId || (localRules && localRules.length > 0)) && (
            <Button
              variant="contained"
              sx={btnEdit(theme)}
              startIcon={<IconPlayerPlay size={18} />}
              onClick={() => onOpenSimulation && onOpenSimulation()}
            >
              Test Rule
            </Button>
          )}
          {Boolean(ruleId || localRules.some(r => r.ruleName === ruleName)) && (
            <Button
              variant="contained"
              sx={btnDelete}
              startIcon={<IconTrash size={18} />}
              onClick={() => {
                const cur = localRules.find(r => r.id === ruleId || r.ruleName === ruleName) || { id: ruleId, ruleName };
                handlePromptDeleteRule(cur);
              }}
            >
              Delete
            </Button>
          )}
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            sx={btnCancel}
            startIcon={<IconX size={18} />}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="contained"
            sx={btnSave}
            startIcon={<IconCheck size={18} />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </DialogActions>

      {/* DELETE RULE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 700 }}>
          <IconAlertCircle size={22} color="#ef4444" />
          Delete Schedule Rule
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Are you sure you want to delete rule "{ruleToDelete?.ruleName}"?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            This will permanently remove all associated condition groups, actions, and priority settings for this rule.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, gap: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#fafafa' }}>
          <Button
            variant="contained"
            sx={btnCancel}
            startIcon={<IconX size={18} />}
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={btnDelete}
            startIcon={<IconTrash size={18} />}
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Rule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RULE BUILDER SOP & USER GUIDE HELP DIALOG */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#0f172a', color: '#ffffff' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBook color="#ffffff" size={22} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Schedule Rule Engine — SOP & Interactive User Guide
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Mastering Rule Building, Condition Logic, Priority Cascading & Fallback Routing
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setHelpOpen(false)} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff' } }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        {/* SOP Navigation Tabs */}
        <Box sx={{ bgcolor: '#0f172a', borderBottom: '1px solid #334155', px: 2 }}>
          <Tabs
            value={sopTab}
            onChange={(e, nv) => setSopTab(nv)}
            sx={{
              '& .MuiTab-root': { color: '#94a3b8', textTransform: 'none', fontWeight: 600, minHeight: 48 },
              '& .Mui-selected': { color: '#38bdf8', fontWeight: 700 },
              '& .MuiTabs-indicator': { backgroundColor: '#38bdf8', height: 3 }
            }}
          >
            <Tab icon={<IconRoute size={18} />} iconPosition="start" label="1. Core SOP Architecture" />
            <Tab icon={<IconPlayerPlay size={18} />} iconPosition="start" label="2. Live Interactive Simulator" />
            <Tab icon={<IconTable size={18} />} iconPosition="start" label="3. All Real-World Logic Samples" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2.5, bgcolor: '#f8fafc', minHeight: 480 }}>
          {/* TAB 0: CORE SOP ARCHITECTURE */}
          {sopTab === 0 && (
            <Box>
              {/* Core Hero Card */}
              <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)', color: '#ffffff' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <IconSparkles size={32} style={{ flexShrink: 0, marginTop: 4 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Visual Rule Execution Engine (WHEN &rarr; THEN &rarr; ELSE)
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                      The Dynamic Rule Builder allows administrators to configure automated scheduling policies for meetings without writing any code. Every rule runs during Meeting Date generation to decide whether to schedule, shift, or skip dates.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* 4-Step Visual Flow Cards */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconTimeline size={20} color="#0284c7" /> 4-Step Processing Pipeline
              </Typography>

              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 2,
                      borderColor: '#bae6fd',
                      bgcolor: '#f0f9ff',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(2, 132, 199, 0.12)' }
                    }}
                  >
                    <Chip label="STEP 1" color="primary" size="small" sx={{ fontWeight: 800, mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369a1', mb: 0.5 }}>
                      WHEN (Conditions)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                      Filter schedule dates using property rules like <strong>Day of Week</strong>, <strong>Occurrence</strong>, <strong>Month</strong>, <strong>Is Holiday</strong>, or <strong>Working Day</strong>.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 2,
                      borderColor: '#bbf7d0',
                      bgcolor: '#f0fdf4',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(34, 197, 94, 0.12)' }
                    }}
                  >
                    <Chip label="STEP 2" color="success" size="small" sx={{ fontWeight: 800, mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#15803d', mb: 0.5 }}>
                      THEN (Actions)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                      Execute target action when WHEN condition matches (e.g. <strong>Schedule Meeting</strong>, <strong>Move to Next Working Day</strong>, or <strong>Skip Date</strong>).
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 2,
                      borderColor: '#fde68a',
                      bgcolor: '#fffbeb',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.12)' }
                    }}
                  >
                    <Chip label="STEP 3" color="warning" size="small" sx={{ fontWeight: 800, mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b45309', mb: 0.5 }}>
                      ELSE (Fallbacks)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                      Backup routing if primary condition fails or if Meeting Date lands on a weekend/holiday.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: 2,
                      borderColor: '#cbd5e1',
                      bgcolor: '#ffffff',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(100, 116, 139, 0.12)' }
                    }}
                  >
                    <Chip label="STEP 4" color="secondary" size="small" sx={{ fontWeight: 800, mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 0.5 }}>
                      Priority Cascade
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                      Rule list order defines priority. <strong>Priority 1 runs first</strong>. Once a rule matches and executes, lower rules are skipped.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Logic Operator Guidelines Box */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                  Logical Group Operator Rules (AND vs OR)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
                        • ALL CONDITIONS MUST MATCH (AND)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Every single condition inside the group must evaluate to True. Example: <em>Month = "March" AND Day of Week = "Wednesday"</em>.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                      <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 700 }}>
                        • ANY CONDITION CAN MATCH (OR)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        At least one condition in the group must be True for the rule to apply. Example: <em>Day of Week = "Saturday" OR Day of Week = "Sunday"</em>.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* TAB 1: LIVE INTERACTIVE SIMULATOR DEMO */}
          {sopTab === 1 && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
                  Click a Sample Scenario to Test Live Execution Trace:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  {[
                    { id: 0, label: 'Scenario A: 1st Saturday (Normal Match)', color: 'primary' },
                    { id: 1, label: 'Scenario B: Republic Day (Holiday Shift)', color: 'warning' },
                    { id: 2, label: 'Scenario C: 2nd Saturday (Condition Failed)', color: 'error' },
                    { id: 3, label: 'Scenario D: QMS Audit (Priority Override)', color: 'info' }
                  ].map(s => (
                    <Chip
                      key={s.id}
                      label={s.label}
                      color={demoScenario === s.id ? s.color : 'default'}
                      variant={demoScenario === s.id ? 'filled' : 'outlined'}
                      onClick={() => setDemoScenario(s.id)}
                      sx={{ fontWeight: 700, cursor: 'pointer', py: 0.5 }}
                    />
                  ))}
                </Stack>
              </Paper>

              {/* Selected Scenario Live Interactive Execution Trace */}
              {(() => {
                const scenarios = [
                  {
                    title: 'Scenario A: 1st Saturday Regular Meeting',
                    candidateDate: '02-Jan-2027 (Saturday)',
                    dayOfWeek: 'Saturday',
                    occurrence: '1st Saturday of Month',
                    isHoliday: 'False',
                    isWorkingDay: 'True',
                    appliedRule: 'WHEN Day of Week = "Saturday" AND Week Occurrence IN "1, 5" THEN Schedule Meeting',
                    steps: [
                      { title: '1. Meeting Date Inspection', detail: 'Evaluating Meeting Date 02-Jan-2027 (Saturday, 1st Saturday)', status: 'PASSED', color: 'info' },
                      { title: '2. WHEN Condition Matching', detail: 'Day of Week = Saturday (MATCH) & Occurrence = 1st Saturday (MATCH)', status: 'MATCHED', color: 'success' },
                      { title: '3. THEN Action Execution', detail: 'Executing Action: SCHEDULE_MEETING on 02-Jan-2027', status: 'EXECUTED', color: 'primary' }
                    ],
                    resultDate: '02-Jan-2027 (Saturday)',
                    resultStatus: 'Meeting Scheduled Successfully',
                    resultColor: 'success'
                  },
                  {
                    title: 'Scenario B: Republic Day Holiday Auto-Shift',
                    candidateDate: '26-Jan-2027 (Tuesday)',
                    dayOfWeek: 'Tuesday',
                    occurrence: '4th Tuesday of Month',
                    isHoliday: 'True (Republic Day)',
                    isWorkingDay: 'False',
                    appliedRule: 'WHEN Is Holiday = "True" THEN Move To Next Working Day',
                    steps: [
                      { title: '1. Meeting Date Inspection', detail: 'Evaluating Meeting Date 26-Jan-2027 (Republic Day Holiday)', status: 'PASSED', color: 'info' },
                      { title: '2. WHEN Condition Matching', detail: 'Is Holiday = True (Republic Day MATCHED!)', status: 'MATCHED', color: 'warning' },
                      { title: '3. THEN Action Execution', detail: 'Action: MOVE_TO_NEXT_WORKING_DAY ➔ Calculating next working day...', status: 'SHIFTING', color: 'warning' },
                      { title: '4. Working Day Resolver', detail: '26-Jan (Holiday) ➔ Resolved to 27-Jan-2027 (Wednesday - Working Day)', status: 'EXECUTED', color: 'success' }
                    ],
                    resultDate: '27-Jan-2027 (Wednesday)',
                    resultStatus: 'Shifted +1 Working Day',
                    resultColor: 'warning'
                  },
                  {
                    title: 'Scenario C: 2nd Saturday Condition Failure',
                    candidateDate: '09-Jan-2027 (Saturday)',
                    dayOfWeek: 'Saturday',
                    occurrence: '2nd Saturday of Month',
                    isHoliday: 'False',
                    isWorkingDay: 'True',
                    appliedRule: 'WHEN Day of Week = "Saturday" AND Week Occurrence IN "1, 5" THEN Schedule Meeting',
                    steps: [
                      { title: '1. Meeting Date Inspection', detail: 'Evaluating Meeting Date 09-Jan-2027 (Saturday, 2nd Saturday)', status: 'PASSED', color: 'info' },
                      { title: '2. WHEN Condition Matching', detail: 'Day of Week = Saturday (MATCH), Occurrence = 2nd Saturday (NO MATCH)', status: 'FAILED', color: 'error' },
                      { title: '3. Fallback Check', detail: 'No ELSE / Fallback configured for this condition group.', status: 'SKIPPED', color: 'secondary' }
                    ],
                    resultDate: 'None (Skipped)',
                    resultStatus: 'Meeting Date Skipped',
                    resultColor: 'default'
                  },
                  {
                    title: 'Scenario D: QMS Priority 1 Rule Cascading Override',
                    candidateDate: '15-Mar-2027 (Monday)',
                    dayOfWeek: 'Monday',
                    occurrence: '3rd Monday of Month',
                    isHoliday: 'False',
                    isWorkingDay: 'True',
                    appliedRule: 'Priority 1: QMS Audit Rule vs Priority 2: Standard Monthly Schedule',
                    steps: [
                      { title: '1. Priority 1 Rule Evaluation', detail: 'Rule #1 (Priority 1): WHEN Month = "March" AND Week = "3" THEN Schedule QMS Audit (MATCHED!)', status: 'MATCHED', color: 'primary' },
                      { title: '2. Action Execution', detail: 'Executing Action: SCHEDULE_AUDIT_MEETING for 15-Mar-2027', status: 'EXECUTED', color: 'success' },
                      { title: '3. Priority Precedence Override', detail: 'Priority 1 matched successfully! Rule #2 (Priority 2) automatically bypassed.', status: 'OVERRIDDEN', color: 'info' }
                    ],
                    resultDate: '15-Mar-2027 (QMS Audit)',
                    resultStatus: 'Priority 1 Precedence Applied',
                    resultColor: 'primary'
                  }
                ];

                const current = scenarios[demoScenario];

                return (
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #bae6fd' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0369a1' }}>
                        {current.title}
                      </Typography>
                      <Chip label={current.resultStatus} color={current.resultColor} size="small" sx={{ fontWeight: 700 }} />
                    </Stack>

                    <Grid container spacing={2} mb={2.5}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Meeting Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{current.candidateDate}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Occurrence</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{current.occurrence}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Is Holiday?</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: current.isHoliday.includes('True') ? 'error.main' : 'text.primary' }}>{current.isHoliday}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" color="text.secondary" display="block">Final Scheduled Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{current.resultDate}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                      Rule Syntax Applied:
                    </Typography>
                    <Paper elevation={0} sx={{ p: 1.2, mb: 2, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.825rem', borderRadius: 1 }}>
                      {current.appliedRule}
                    </Paper>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                      Execution Trace Logs:
                    </Typography>
                    <Stack spacing={1}>
                      {current.steps.map((st, idx) => (
                        <Box key={idx} sx={{ p: 1.2, borderRadius: 1, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <IconCircleCheck size={16} color="#0284c7" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{st.title}:</Typography>
                            <Typography variant="body2" color="text.secondary">{st.detail}</Typography>
                          </Stack>
                          <Chip label={st.status} color={st.color} size="small" sx={{ fontWeight: 700, height: 22 }} />
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                );
              })()}
            </Box>
          )}

          {/* TAB 2: ALL REAL-WORLD LOGIC SAMPLES */}
          {sopTab === 2 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconListCheck size={20} color="#0284c7" /> Real-World Logic Samples & Evaluation Matrix
              </Typography>

              {/* Sample 1 */}
              <Accordion defaultExpanded variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Sample 1: 1st & 5th Saturday Schedule (Nth Occurrence)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', borderRadius: 1, mb: 1.5, fontSize: '0.825rem' }}>
                    WHEN Day Of Week = "Saturday" AND Week Occurrence IN "1, 5" THEN Schedule Meeting
                  </Paper>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Meeting Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Day of Week</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Occurrence</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Rule Result</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Action Executed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>02-Jan-2027</TableCell>
                          <TableCell>Saturday</TableCell>
                          <TableCell>1st Saturday</TableCell>
                          <TableCell><Chip label="MATCHED" size="small" color="success" /></TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>Schedule Meeting (02-Jan-2027)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>09-Jan-2027</TableCell>
                          <TableCell>Saturday</TableCell>
                          <TableCell>2nd Saturday</TableCell>
                          <TableCell><Chip label="NO MATCH" size="small" color="default" /></TableCell>
                          <TableCell color="text.secondary">Skipped (Condition Failed)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>30-Jan-2027</TableCell>
                          <TableCell>Saturday</TableCell>
                          <TableCell>5th Saturday</TableCell>
                          <TableCell><Chip label="MATCHED" size="small" color="success" /></TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>Schedule Meeting (30-Jan-2027)</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Sample 2 */}
              <Accordion variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Sample 2: Holiday Adjustment (Move to Next Working Day)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', borderRadius: 1, mb: 1.5, fontSize: '0.825rem' }}>
                    WHEN Is Holiday = "True" THEN Move To Next Working Day
                  </Paper>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Meeting Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Is Holiday?</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Rule Result</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Action Executed</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Final Scheduled Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>26-Jan-2027</TableCell>
                          <TableCell><Chip label="Holiday (Republic Day)" size="small" color="error" /></TableCell>
                          <TableCell><Chip label="MATCHED" size="small" color="warning" /></TableCell>
                          <TableCell>Shifted to Next Working Day</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>27-Jan-2027 (Wednesday)</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Sample 3 */}
              <Accordion variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Sample 3: Working Day Filter (Exclude Weekends & Non-Working Days)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', borderRadius: 1, mb: 1.5, fontSize: '0.825rem' }}>
                    WHEN Is Working Day = "False" THEN Move To Next Working Day
                  </Paper>
                  <Typography variant="caption" color="text.secondary">
                    Automatically checks working day calendar profiles. If Meeting Date lands on a Sunday or company off-day, it moves forward to Monday.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Sample 4 */}
              <Accordion variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Sample 4: Quarterly / Bi-Annual Schedule (Month & Week Condition Grouping)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', borderRadius: 1, mb: 1.5, fontSize: '0.825rem' }}>
                    WHEN (Month = "March" OR Month = "September") AND Week Of Month = "1" THEN Schedule Meeting
                  </Paper>
                  <Typography variant="caption" color="text.secondary">
                    Demonstrates nested OR inside AND logic. Meetings will only trigger in March or September during the 1st week.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Sample 5 */}
              <Accordion variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Sample 5: Multi-Rule Cascading Priority (Priority 1 &gt; Priority 2)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Rules evaluate sequentially from top to bottom. First matching rule wins.
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>Rule #1 (Priority 1 - High Priority Audit):</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>WHEN Month = "December" AND Week = "4" THEN Schedule Year-End Audit</Typography>
                    </Box>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Rule #2 (Priority 2 - Regular Schedule):</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>WHEN Day of Week = "Friday" THEN Schedule Weekly Sync</Typography>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Sample 6 */}
              <Accordion variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Sample 6: Fallback Protection Strategy (ELSE Actions)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', borderRadius: 1, mb: 1.5, fontSize: '0.825rem' }}>
                    WHEN Day of Week = "Saturday" THEN Schedule Meeting<br />
                    ELSE / FALLBACK: Move To Next Working Day
                  </Paper>
                  <Typography variant="caption" color="text.secondary">
                    If primary condition fails or date cannot be scheduled, system automatically engages fallback actions.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, bgcolor: '#f1f5f9', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Tip: Use the "Simulate Schedule" button on the bottom left to test live date evaluations!
          </Typography>
          <Button variant="contained" color="primary" onClick={() => setHelpOpen(false)} sx={{ fontWeight: 700, px: 3 }}>
            Got It! Close Guide
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
