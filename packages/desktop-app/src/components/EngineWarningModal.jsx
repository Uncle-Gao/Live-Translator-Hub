import { Sparkles, ExternalLink, X } from 'lucide-react';

const EngineWarningModal = ({ engineName, scenario, configuredNames, onGoConfig, onContinue, onClose }) => {
  const descriptions = {
    noEngines: (
      <>
        你当前在部署配置中选择了<em className="text-amber-400/80 not-italic">「无引擎」模式</em>，部署后仅依赖静态字典翻译，字典未收录的文本将<span className="text-red-400/80">无法翻译</span>。
        <br /><br />
        配置 AI API 密钥后，应用可对字典外的文本进行<em className="text-amber-400/80 not-italic">实时翻译</em>，
        极大提升翻译覆盖面和质量，让本地化更完整、更自然。
      </>
    ),
    noneWithEngines: (
      <>
        你当前在部署配置中选择了<em className="text-amber-400/80 not-italic">「无引擎」模式</em>，但已配置了
        <em className="text-emerald-400/80 not-italic"> {configuredNames?.join('、')} </em>的 API 密钥。
        <br /><br />
        切换到已配置的引擎即可对字典未收录的文本进行<em className="text-amber-400/80 not-italic">实时翻译</em>，
        极大提升翻译覆盖面和质量，让本地化更完整、更自然。
      </>
    ),
    unconfigured: (
      <>
        你选择了<em className="text-amber-400/80 not-italic">「{engineName}」</em>引擎，但尚未在 API 密钥管理中配置该引擎的 API 密钥。
        <br /><br />
        请前往配置页面填入密钥，或切换到已配置的引擎。配置 AI 密钥后可对字典未收录的文本进行<em className="text-amber-400/80 not-italic">实时翻译</em>，
        极大提升翻译覆盖面和质量。
      </>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#1A1C1E] border border-white/10 rounded-3xl p-8 w-[500px] max-w-[90vw] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">建议配置 AI 翻译引擎</h3>
            <p className="text-sm text-white/40 mt-2 leading-relaxed">
              {descriptions[scenario] || descriptions.noEngines}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onContinue}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/50 text-sm font-medium rounded-2xl transition-all"
          >
            仍然部署
          </button>
          <button
            onClick={onGoConfig}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-sm font-bold rounded-2xl transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            前往配置 API 密钥
          </button>
        </div>
      </div>
    </div>
  );
};

export default EngineWarningModal;
